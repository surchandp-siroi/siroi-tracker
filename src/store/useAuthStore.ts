import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useDataStore } from './useDataStore';
import { useSessionStore } from './useSessionStore';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

// Login lock: prevents onAuthStateChange from overwriting state mid-login
let isLoginInProgress = false;

// Helper to wrap promises with a timeout to prevent infinite loading
const withTimeout = <T>(promise: PromiseLike<T>, timeoutMs = 15000, errorMessage = "Request timed out. Please refresh or try again."): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });
  return Promise.race([Promise.resolve(promise), timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

export type UserRole = 'admin' | 'statehead' | 'manager';

export const BRANCH_ACCOUNTS: Record<string, { branchId: string; branchName: string; role: UserRole; managerName: string }> = {
  // Branch Managers (Access Managers Dashboard)
  'aroop.sharma@siroiforex.com': { branchId: 'b1', branchName: 'Guwahati', role: 'manager', managerName: 'Aroop Sharma' },
  'ajay.waikhom@siroiforex.com': { branchId: 'b2', branchName: 'Manipur', role: 'manager', managerName: 'Ajay Waikhom' },
  'nobin.nani@siroiforex.com': { branchId: 'b3', branchName: 'Itanagar', role: 'manager', managerName: 'Nobin Nani' },
  'ramesh@siroiforex.com': { branchId: 'b4', branchName: 'Nagaland & Mizoram', role: 'manager', managerName: 'Ramesh Singh' },
  
  // MIS Data Entry Accounts (Access Data Entry Terminal /entry)
  'mis.ghy@siroiforex.com': { branchId: 'b1', branchName: 'Guwahati', role: 'statehead', managerName: 'Aroop Sharma' },
  'mis.manipur@siroiforex.com': { branchId: 'b2', branchName: 'Manipur', role: 'statehead', managerName: 'Ajay Waikhom' },
  'mis.itanagar@siroiforex.com': { branchId: 'b3', branchName: 'Itanagar', role: 'statehead', managerName: 'Nobin Nani' },
  'mis.mizonaga@siroiforex.com': { branchId: 'b4', branchName: 'Nagaland & Mizoram', role: 'statehead', managerName: 'Ramesh Singh' },
};

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  branchId: string | null;
  createdAt?: string;
  latestLocation?: string;
  displayName?: string | null;
  avatarSeed?: string | null;
}

export const syncUserProfile = async (sbUser: SupabaseUser, location?: string, emailFromLogin?: string): Promise<UserProfile> => {
  const { data: userDoc } = await supabase
    .from('users')
    .select('*')
    .eq('id', sbUser.id)
    .maybeSingle();

  // Resolve email: prefer explicit login email, then DB email, then Auth email
  const effectiveEmail = (emailFromLogin || userDoc?.email || sbUser.email || '').toLowerCase().trim();

  let profile: UserProfile;

  const isSuperAdminEmail = ['tomas@siroiforex.com', 'surchanddsingh@siroiforex.com', 'sharjuthoudam@siroiforex.com', 'executive@siroiforex.com'].includes(effectiveEmail);
  const matchedBranchAccount = BRANCH_ACCOUNTS[effectiveEmail];

  // In-memory application role
  const expectedRole: UserRole = isSuperAdminEmail ? 'admin' : matchedBranchAccount ? matchedBranchAccount.role : 'statehead';
  // DB column role (stored in database to satisfy Postgres users_role_check constraint)
  const dbRole = expectedRole === 'manager' ? 'statehead' : expectedRole;

  const expectedBranchId: string | null = isSuperAdminEmail ? null : matchedBranchAccount ? matchedBranchAccount.branchId : null;
  const expectedLocation: string | undefined = location || matchedBranchAccount?.branchName || (isSuperAdminEmail ? 'HO' : undefined);
  const expectedDisplayName: string | null = matchedBranchAccount?.managerName || userDoc?.displayName || (isSuperAdminEmail ? 'Administrator' : null);

  if (userDoc) {
    profile = {
      ...(userDoc as UserProfile),
      email: effectiveEmail,
      role: expectedRole, // Always preserve 'manager' in application memory
      branchId: expectedBranchId !== null ? expectedBranchId : userDoc.branchId,
      latestLocation: expectedLocation || userDoc.latestLocation,
      displayName: expectedDisplayName || userDoc.displayName
    };
        
    let needsUpdate = false;
    const updates: any = {};

    if (expectedLocation && expectedLocation !== userDoc.latestLocation) {
      updates.latestLocation = expectedLocation;
      needsUpdate = true;
    }

    if (userDoc.role !== dbRole) {
      updates.role = dbRole;
      needsUpdate = true;
    }

    if (expectedBranchId !== undefined && userDoc.branchId !== expectedBranchId) {
      updates.branchId = expectedBranchId;
      needsUpdate = true;
    }

    if (expectedDisplayName && (!userDoc.displayName || userDoc.displayName !== expectedDisplayName)) {
      updates.displayName = expectedDisplayName;
      needsUpdate = true;
    }

    if (effectiveEmail && userDoc.email !== effectiveEmail) {
      updates.email = effectiveEmail;
      needsUpdate = true;
    }

    if (needsUpdate) {
      await supabase.from('users').update(updates).eq('id', sbUser.id);
    }
  } else {
    profile = {
      id: sbUser.id,
      email: effectiveEmail,
      role: expectedRole, // In application state: 'manager'
      branchId: expectedBranchId,
      latestLocation: expectedLocation,
      displayName: expectedDisplayName
    };

    const dbInsertPayload = {
      id: sbUser.id,
      email: effectiveEmail,
      role: dbRole, // In database: 'statehead' to satisfy users_role_check constraint
      branchId: expectedBranchId,
      latestLocation: expectedLocation,
      displayName: expectedDisplayName
    };

    const { error: insertError } = await supabase.from('users').insert([dbInsertPayload]);

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
  requestOtpLogin: (email: string, location: string, phone?: string, channel?: 'whatsapp' | 'sms') => Promise<void>;
  verifyOtpLogin: (email: string, otp: string, location: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  initAuth: () => void;
  updateProfile: (displayName: string, avatarSeed: string) => Promise<boolean>;
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

      const { data: authData, error: authErr } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        15000,
        "Sign-in request timed out. Please try again."
      );

      if (authErr) {
        // If user exists in our 'users' table, then this is just a wrong password error
        const { data: existingDbUser } = await withTimeout(
          supabase.from('users').select('id').eq('email', email).maybeSingle(),
          10000,
          "Verification timed out. Please try again."
        );
        if (existingDbUser) {
          throw new Error("Invalid login credentials");
        }

        // Auto-register super users or pre-approved demo users if they don't exist yet
        if (
          (email === 'tomas@siroiforex.com' && password === 'T0mas94@#') ||
          (email === 'surchanddsingh@siroiforex.com' && password === 'Surchand@2026') ||
          (email === 'executive@siroiforex.com' && password === 'exeSiroi@2026')
        ) {
          const { data: createResult, error: createError } = await withTimeout(
            supabase.auth.signUp({ email, password }),
            15000,
            "Account creation timed out. Please try again."
          );
          if (createError) throw new Error(createError.message);
          if (!createResult.user) throw new Error("Could not create user account.");
          sbUser = createResult.user;
        } else {
          // Not super users and don't exist yet, log access request
          await withTimeout(
            supabase.from('accessRequests').insert([{
              email,
              location,
              timestamp: new Date().toISOString(),
              status: 'pending'
            }]),
            10000,
            "Request timed out. Please try again."
          );
          throw new Error("Admin will be notified for access requested.");
        }
      } else {
        if (!authData.user) throw new Error("Authentication failed.");
        sbUser = authData.user;
      }

      const profile = await withTimeout(
        syncUserProfile(sbUser, location, email),
        15000,
        "Profile synchronization timed out. Please refresh the page or try again."
      );

      useSessionStore.getState().updateActivity();
      set({ user: profile, supabaseUser: sbUser, isLoading: false, isInitialized: true });
      setTimeout(() => { isLoginInProgress = false; }, 1500);
    } catch (error: any) {
      isLoginInProgress = false;
      set({ isLoading: false });
      throw new Error(error.message || "Failed to authenticate");
    }
  },

  requestOtpLogin: async (rawEmail, location, phone, channel = 'whatsapp') => {
    set({ isLoading: true });
    try {
      const email = rawEmail.trim().toLowerCase();

      const isSuperAdmin = ['tomas@siroiforex.com', 'surchanddsingh@siroiforex.com', 'sharjuthoudam@siroiforex.com', 'executive@siroiforex.com'].includes(email);

      if (!isSuperAdmin) {
        if (new Date().getDay() === 0) {
          throw new Error("Sunday is a holiday. Branch login is disabled.");
        }
        const branchMatch = BRANCH_ACCOUNTS[email];

        if (!branchMatch || (location !== 'HO' && branchMatch.branchName !== location)) {
          throw new Error("UNAUTHORIZED_LOCATION");
        }
      }

      let signInOptions: any = {
        email,
        options: { shouldCreateUser: true }
      };

      if (phone) {
        const cleanPhone = phone.replace(/\s+/g, '');
        const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;
        
        try {
          await supabase.from('otp_preferences').upsert({
            phone: formattedPhone,
            channel: channel || 'whatsapp',
            updated_at: new Date().toISOString()
          });
        } catch (prefErr) {
          console.warn("[Auth] Failed to record otp preference:", prefErr);
        }

        signInOptions = {
          phone: cleanPhone,
          options: { channel: channel || 'whatsapp' }
        };
      }

      const { error } = await withTimeout(
        supabase.auth.signInWithOtp(signInOptions),
        45000,
        "Sending OTP timed out. Please check your connection and try again."
      );

      if (error) throw new Error(error.message);

      set({ isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.message || "Failed to send OTP");
    }
  },

  verifyOtpLogin: async (rawEmail, otp, location, phone) => {
    isLoginInProgress = true;
    set({ isLoading: true });
    try {
      console.log("[Auth] verifyOtpLogin started for:", rawEmail);
      const email = rawEmail.trim().toLowerCase();

      console.log("[Auth] Calling supabase.auth.verifyOtp");

      let verifyOptions: any = {
        email,
        token: otp,
        type: 'email'
      };

      if (phone) {
        verifyOptions = {
          phone: phone.replace(/\s+/g, ''),
          token: otp,
          type: 'sms' // Supabase uses 'sms' for both sms and whatsapp token verification
        };
      }

      const { data, error } = await withTimeout(
        supabase.auth.verifyOtp(verifyOptions),
        15000,
        "OTP verification timed out. Please check your connection or refresh to see if you are logged in."
      );

      console.log("[Auth] supabase.auth.verifyOtp returned. Error:", error?.message);

      if (error) throw new Error(error.message);
      if (!data.user) throw new Error("Authentication failed.");

      console.log("[Auth] Calling syncUserProfile for user:", data.user.id);

      const profile = await withTimeout(
        syncUserProfile(data.user, location, email),
        15000,
        "Profile synchronization timed out. Please refresh the page or try again."
      );

      console.log("[Auth] syncUserProfile completed successfully.");

      console.log("[Auth] Setting user profile into Zustand state.");
      useSessionStore.getState().updateActivity();
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

  updateProfile: async (displayName, avatarSeed) => {
    const { user } = get();
    if (!user) return false;
    try {
      const { error } = await supabase
        .from('users')
        .update({ displayName, avatarSeed })
        .eq('id', user.id);

      if (error) throw error;

      set({
        user: {
          ...user,
          displayName,
          avatarSeed
        }
      });
      return true;
    } catch (err) {
      console.error("Failed to update user profile:", err);
      return false;
    }
  },

  logout: async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Preferences.remove({ key: 'native_credentials' });
      } catch (err) {
        console.error('Failed to clear native credentials on logout', err);
      }
    }
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
          const profile = await withTimeout(
            syncUserProfile(session.user),
            10000,
            "Profile sync timeout during init."
          );
          useSessionStore.getState().updateActivity();
          set({ user: profile, supabaseUser: session.user, isInitialized: true });
        } catch (err) {
          console.warn("Auth sync error:", err);
          set((state) => ({
            supabaseUser: session.user,
            user: state.user,
            isInitialized: true
          }));
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
