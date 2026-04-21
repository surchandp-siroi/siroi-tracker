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

interface AuthState {
  user: UserProfile | null;
  supabaseUser: SupabaseUser | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string, location: string) => Promise<void>;
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
      
      const { data: userDoc, error: userDocErr } = await supabase
        .from('users')
        .select('*')
        .eq('id', sbUser.id)
        .single();
      
      let profile: UserProfile;
      
      if (userDoc) {
        profile = userDoc as UserProfile;
        if (location) {
           await supabase.from('users').update({ latestLocation: location }).eq('id', sbUser.id);
           profile.latestLocation = location;
        }
      } else {
        // Bootstrapping logic
        const isFirstAdmin = email === 'tomas@siroiforex.com' || email === 'surchanddsingh@siroiforex.com';
        
        const branchMatch = useDataStore.getState().branches.find(b => b.managerEmail === email);
        
        profile = {
          id: sbUser.id,
          email: sbUser.email!,
          role: isFirstAdmin ? 'admin' : 'statehead',
          branchId: branchMatch ? branchMatch.id : null,
          latestLocation: location || undefined
        };
        
        const { error: insertError } = await supabase.from('users').insert([profile]);
        
        // If it's a duplicate key, it means a parallel session (or rapid double-click) already inserted the user
        // We can safely ignore it and proceed, as the user now exists in the database.
        if (insertError && !insertError.message.includes("duplicate key value")) {
           console.error("Failed to insert user profile:", insertError);
           throw new Error(insertError.message || "Could not initialize user profile");
        }
      }
      
      set({ user: profile, supabaseUser: sbUser, isLoading: false, isInitialized: true });
      // Keep lock briefly so the async onAuthStateChange callback doesn't overwrite
      setTimeout(() => { isLoginInProgress = false; }, 1500);
    } catch (error: any) {
      isLoginInProgress = false;
      set({ isLoading: false });
      throw new Error(error.message || "Failed to authenticate");
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, supabaseUser: null });
  },

  initAuth: () => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      // Skip if login() is handling auth — prevents race condition
      if (isLoginInProgress) return;

      if (session?.user) {
        const { data: userDoc, error: userDocErr } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (userDoc) {
            set({ user: userDoc as UserProfile, supabaseUser: session.user, isInitialized: true });
        } else {
            console.warn("Auth sync: Profile not found in 'users' table.", userDocErr || "No error returned, just null data.");
            // Do NOT sign out immediately. The login() function might be in the middle of provisioning the user profile.
            set({ supabaseUser: session.user, user: null, isInitialized: true });
        }
      } else {
        set({ user: null, supabaseUser: null, isInitialized: true });
      }
    });

    // Also check initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
       if (!session?.user) {
          set({ isInitialized: true });
       }
    });
  }
}));
