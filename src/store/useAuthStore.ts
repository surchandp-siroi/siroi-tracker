import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useDataStore } from './useDataStore';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

// Login lock: prevents onAuthStateChange from overwriting state mid-login
let isLoginInProgress = false;

export type UserRole = 'admin' | 'statehead';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  branchId: string | null;
  createdAt?: string;
  latestLocation?: string;
}

export const syncUserProfile = async (sbUser: SupabaseUser, location?: string): Promise<UserProfile> => {
    const { data: userDoc } = await supabase
        .from('users')
        .select('*')
        .eq('id', sbUser.id)
        .maybeSingle();
      
    let profile: UserProfile;
    
    if (userDoc) {
        profile = userDoc as UserProfile;
        if (location && location !== profile.latestLocation) {
            await supabase.from('users').update({ latestLocation: location }).eq('id', sbUser.id);
            profile.latestLocation = location;
        }
    } else {
        const email = sbUser.email!;
        const isFirstAdmin = email === 'tomas@siroiforex.com' || email === 'surchanddsingh@siroiforex.com';
        const branchMatch = useDataStore.getState().branches.find(b => b.managerEmail === email);
        
        profile = {
            id: sbUser.id,
            email: email,
            role: isFirstAdmin ? 'admin' : 'statehead',
            branchId: branchMatch ? branchMatch.id : null,
            latestLocation: location || undefined
        };
        
        const { error: insertError } = await supabase.from('users').insert([profile]);
        
        if (insertError && !insertError.message.includes("duplicate key value")) {
            console.error("Failed to insert user profile:", insertError);
            throw new Error(insertError.message || "Could not initialize user profile");
        }
    }
    return profile;
};

interface AuthState {
  user: UserProfile | null;
  supabaseUser: SupabaseUser | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string, location: string) => Promise<void>;
  requestOtpLogin: (email: string, location: string) => Promise<void>;
  verifyOtpLogin: (email: string, otp: string, location: string) => Promise<void>;
  logout: () => Promise<void>;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  supabaseUser: null,
  isLoading: false,
  isInitialized: false,

  login: async (rawEmail, password, location) => {
    isLoginInProgress = true;
    set({ isLoading: true });
    try {
      const email = rawEmail.trim().toLowerCase();
      let sbUser: SupabaseUser;
      
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authErr) {
         // If user exists in our 'users' table, then this is just a wrong password error
         const { data: existingDbUser } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
         if (existingDbUser) {
             throw new Error("Invalid login credentials");
         }

         // Auto-register super users or pre-approved demo users if they don't exist yet
         if (
           (email === 'tomas@siroiforex.com' && password === 'T0mas94@#') ||
           (email === 'surchanddsingh@siroiforex.com' && password === 'Surchand@2026') ||
           (email === 'executive@siroiforex.com' && password === 'exeSiroi@2026')
         ) {
           const { data: createResult, error: createError } = await supabase.auth.signUp({
            email,
            password
           });
           if (createError) throw new Error(createError.message);
           if (!createResult.user) throw new Error("Could not create user account.");
           sbUser = createResult.user;
         } else {
           // Not super users and don't exist yet, log access request
           await supabase.from('accessRequests').insert([{
               email, 
               location, 
               timestamp: new Date().toISOString(), 
               status: 'pending' 
           }]);
           throw new Error("Admin will be notified for access requested.");
         }
      } else {
         if (!authData.user) throw new Error("Authentication failed.");
         sbUser = authData.user;
      }
      
      const profile = await syncUserProfile(sbUser, location);
      
      set({ user: profile, supabaseUser: sbUser, isLoading: false, isInitialized: true });
      setTimeout(() => { isLoginInProgress = false; }, 1500);
    } catch (error: any) {
      isLoginInProgress = false;
      set({ isLoading: false });
      throw new Error(error.message || "Failed to authenticate");
    }
  },

  requestOtpLogin: async (rawEmail, location) => {
    set({ isLoading: true });
    try {
      const email = rawEmail.trim().toLowerCase();
      
      const branchMatch = useDataStore.getState().branches.find(b => b.managerEmail === email);
      
      if (!branchMatch || branchMatch.name !== location) {
         throw new Error("UNAUTHORIZED_LOCATION");
      }

      const { error } = await supabase.auth.signInWithOtp({ 
          email,
          options: { shouldCreateUser: true }
      });
      
      if (error) throw new Error(error.message);
      
      set({ isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.message || "Failed to send OTP");
    }
  },

  verifyOtpLogin: async (rawEmail, otp, location) => {
    isLoginInProgress = true;
    set({ isLoading: true });
    try {
      console.log("[Auth] verifyOtpLogin started for:", rawEmail);
      const email = rawEmail.trim().toLowerCase();

      console.log("[Auth] Calling supabase.auth.verifyOtp");
      
      const verifyPromise = supabase.auth.verifyOtp({
          email,
          token: otp,
          type: 'email'
      });
      
      const verifyTimeout = new Promise<any>((_, reject) => 
          setTimeout(() => reject(new Error("OTP verification timed out after 10 seconds. Please check your connection.")), 10000)
      );
      
      const { data, error } = await Promise.race([verifyPromise, verifyTimeout]);
      console.log("[Auth] supabase.auth.verifyOtp returned. Error:", error?.message);
      
      if (error) throw new Error(error.message);
      if (!data.user) throw new Error("Authentication failed.");
      
      console.log("[Auth] Calling syncUserProfile for user:", data.user.id);
      
      // Add a timeout failsafe to prevent infinite loading if syncUserProfile hangs
      const profilePromise = syncUserProfile(data.user, location);
      const timeoutPromise = new Promise<UserProfile>((_, reject) => 
          setTimeout(() => reject(new Error("Profile synchronization timed out after 10 seconds")), 10000)
      );
      
      const profile = await Promise.race([profilePromise, timeoutPromise]);
      console.log("[Auth] syncUserProfile completed successfully.");
      
      console.log("[Auth] Setting user profile into Zustand state.");
      set({ user: profile, supabaseUser: data.user, isLoading: false, isInitialized: true });
      setTimeout(() => { isLoginInProgress = false; }, 1500);
      console.log("[Auth] verifyOtpLogin successfully finished.");
    } catch (error: any) {
      console.error("[Auth] verifyOtpLogin failed with error:", error);
      isLoginInProgress = false;
      set({ isLoading: false });
      throw new Error(error.message || "Failed to verify OTP");
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, supabaseUser: null });
  },

  initAuth: () => {
    if (get().isInitialized) return;

    let initialSessionHandled = false;

    const handleSession = async (session: Session | null) => {
        if (isLoginInProgress) return;

        if (session?.user) {
            try {
                const profile = await syncUserProfile(session.user);
                set({ user: profile, supabaseUser: session.user, isInitialized: true });
            } catch (err) {
                console.warn("Auth sync error:", err);
                set({ supabaseUser: session.user, user: null, isInitialized: true });
            }
        } else {
            set({ user: null, supabaseUser: null, isInitialized: true });
        }
    };

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (isLoginInProgress) return;
      initialSessionHandled = true;
      await handleSession(session);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
       if (!initialSessionHandled) {
          initialSessionHandled = true;
          await handleSession(session);
       }
    });
  }
}));
