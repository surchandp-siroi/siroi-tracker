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
export type PerspectiveRole = 'admin' | 'manager' | 'branch';

export interface AuthorizedUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'manager' | 'branch';
  branchName?: string;
  branchId?: string;
  isSuperAdmin?: boolean;
  initials?: string;
  color?: 'lime' | 'pink' | 'neutral' | 'blue';
}

export const INITIAL_AUTHORIZED_USERS: AuthorizedUser[] = [
  { id: 'u1', name: 'Surchand Singh', email: 'surchanddsingh@siroiforex.com', phone: '+91 81189 25964', role: 'admin', initials: 'SS', color: 'lime' },
  { id: 'u2', name: 'Sharjubala Thoudam', email: 'sharjuthoudam@siroiforex.com', phone: '+91 97069 94547', role: 'admin', isSuperAdmin: true, initials: 'ST', color: 'pink' },
  { id: 'u3', name: 'Developer', email: 'executive@siroiforex.com', phone: '+91 98765 43210', role: 'admin', initials: 'DE', color: 'blue' },
  { id: 'u4', name: 'Ajay Waikhom', email: 'ajay.waikhom@siroiforex.com', phone: '+91 89740 53213', role: 'manager', branchName: 'Manipur', branchId: 'b2', initials: 'AW', color: 'neutral' },
  { id: 'u5', name: 'Aroop Sharma', email: 'aroop.sharma@siroiforex.com', phone: '+91 94350 12345', role: 'manager', branchName: 'Guwahati', branchId: 'b1', initials: 'AS', color: 'neutral' },
  { id: 'u6', name: 'Nobin Nani', email: 'nobin.nani@siroiforex.com', phone: '+91 98620 54321', role: 'manager', branchName: 'Itanagar', branchId: 'b3', initials: 'NN', color: 'neutral' },
  { id: 'u7', name: 'Ramesh Singh', email: 'ramesh@siroiforex.com', phone: '+91 97740 67890', role: 'manager', branchName: 'Nagaland & Mizoram', branchId: 'b4', initials: 'RS', color: 'neutral' },
  { id: 'u8', name: 'Guwahati Terminal', email: 'mis.ghy@siroiforex.com', role: 'branch', branchName: 'Guwahati', branchId: 'b1', initials: 'GH', color: 'lime' },
  { id: 'u9', name: 'Imphal Terminal', email: 'mis.manipur@siroiforex.com', role: 'branch', branchName: 'Manipur', branchId: 'b2', initials: 'IM', color: 'neutral' },
  { id: 'u10', name: 'Itanagar Terminal', email: 'mis.itanagar@siroiforex.com', role: 'branch', branchName: 'Itanagar', branchId: 'b3', initials: 'IT', color: 'pink' },
  { id: 'u11', name: 'Nagaland & Mizoram Terminal', email: 'mis.mizonaga@siroiforex.com', role: 'branch', branchName: 'Nagaland & Mizoram', branchId: 'b4', initials: 'NM', color: 'neutral' },
];

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
  activePerspective: PerspectiveRole;
  activeManagerBranch: string;
  activeManagerBranchId: string;
  authorizedUsers: AuthorizedUser[];
  setActivePerspective: (perspective: PerspectiveRole, branchName?: string, branchId?: string) => void;
  setActiveManagerBranch: (branchName: string, branchId?: string) => void;
  addAuthorizedUser: (user: Omit<AuthorizedUser, 'id'>) => void;
  updateUserRole: (email: string, newRole: 'admin' | 'manager' | 'branch') => void;
  removeAuthorizedUser: (email: string) => void;
  login: (email: string, password: string, location: string) => Promise<void>;
  requestOtpLogin: (email: string, location: string, phone?: string, channel?: 'whatsapp' | 'sms') => Promise<void>;
  verifyOtpLogin: (email: string, otp: string, location: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  initAuth: () => void;
  updateProfile: (displayName: string, avatarSeed: string) => Promise<boolean>;
}

const getStoredAuthorizedUsers = (): AuthorizedUser[] => {
  if (typeof window === 'undefined') return INITIAL_AUTHORIZED_USERS;
  try {
    const raw = localStorage.getItem('siroi_authorized_users');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Could not read authorized users from localStorage", e);
  }
  return INITIAL_AUTHORIZED_USERS;
};

const getStoredPerspective = (): PerspectiveRole => {
  if (typeof window === 'undefined') return 'admin';
  try {
    const saved = localStorage.getItem('siroi_active_perspective') as PerspectiveRole;
    if (saved === 'admin' || saved === 'manager' || saved === 'branch') return saved;
  } catch {}
  return 'admin';
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  supabaseUser: null,
  isLoading: false,
  isInitialized: false,
  activePerspective: getStoredPerspective(),
  activeManagerBranch: 'Guwahati',
  activeManagerBranchId: 'b1',
  authorizedUsers: getStoredAuthorizedUsers(),

  setActivePerspective: (perspective, branchName, branchId) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('siroi_active_perspective', perspective);
      } catch {}
    }
    set({
      activePerspective: perspective,
      ...(branchName ? { activeManagerBranch: branchName } : {}),
      ...(branchId ? { activeManagerBranchId: branchId } : {}),
    });
  },

  setActiveManagerBranch: (branchName, branchId) => {
    const branchMap: Record<string, string> = {
      'Guwahati': 'b1',
      'Manipur': 'b2',
      'Itanagar': 'b3',
      'Nagaland & Mizoram': 'b4',
    };
    const resolvedId = branchId || branchMap[branchName] || 'b1';
    set({
      activeManagerBranch: branchName,
      activeManagerBranchId: resolvedId,
    });
  },

  addAuthorizedUser: (newUser) => {
    const current = get().authorizedUsers;
    const initials = newUser.initials || newUser.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'US';
    const id = `u_${Date.now()}`;
    const userWithId: AuthorizedUser = {
      ...newUser,
      id,
      initials,
      color: newUser.color || (newUser.role === 'admin' ? 'lime' : newUser.role === 'manager' ? 'neutral' : 'pink'),
    };
    const updated = [...current, userWithId];
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('siroi_authorized_users', JSON.stringify(updated));
      } catch {}
    }
    set({ authorizedUsers: updated });
  },

  updateUserRole: (email, newRole) => {
    const current = get().authorizedUsers;
    const lowerEmail = email.toLowerCase().trim();
    const updated = current.map((u) => {
      if (u.email.toLowerCase().trim() === lowerEmail) {
        return {
          ...u,
          role: newRole,
          isSuperAdmin: u.isSuperAdmin && newRole === 'admin',
        };
      }
      return u;
    });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('siroi_authorized_users', JSON.stringify(updated));
      } catch {}
    }
    set({ authorizedUsers: updated });
  },

  removeAuthorizedUser: (email) => {
    const current = get().authorizedUsers;
    const lowerEmail = email.toLowerCase().trim();
    // Protect Sharjubala (super admin)
    if (lowerEmail === 'sharjuthoudam@siroiforex.com') return;
    const updated = current.filter((u) => u.email.toLowerCase().trim() !== lowerEmail);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('siroi_authorized_users', JSON.stringify(updated));
      } catch {}
    }
    set({ authorizedUsers: updated });
  },

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

      const defaultPerspective: PerspectiveRole = profile.role === 'admin' ? 'admin' : profile.role === 'manager' ? 'manager' : 'branch';
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('siroi_active_perspective', defaultPerspective);
        } catch {}
      }

      useSessionStore.getState().updateActivity();
      set({
        user: profile,
        supabaseUser: sbUser,
        isLoading: false,
        isInitialized: true,
        activePerspective: defaultPerspective,
      });
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

      const defaultPerspective: PerspectiveRole = profile.role === 'admin' ? 'admin' : profile.role === 'manager' ? 'manager' : 'branch';
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('siroi_active_perspective', defaultPerspective);
        } catch {}
      }

      console.log("[Auth] Setting user profile into Zustand state.");
      useSessionStore.getState().updateActivity();
      set({
        user: profile,
        supabaseUser: data.user,
        isLoading: false,
        isInitialized: true,
        activePerspective: defaultPerspective,
      });
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
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('siroi_auth_email');
        sessionStorage.clear();
        localStorage.removeItem('siroi_active_perspective');
      } catch (err) {
        console.warn('Failed to clear storage on logout', err);
      }
    }
    if (Capacitor.isNativePlatform()) {
      try {
        await Preferences.remove({ key: 'native_credentials' });
      } catch (err) {
        console.error('Failed to clear native credentials on logout', err);
      }
    }
    await supabase.auth.signOut();
    set({ user: null, supabaseUser: null, activePerspective: 'admin' });
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
