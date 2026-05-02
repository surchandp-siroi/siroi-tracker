import { create } from 'zustand';

interface SessionState {
  lastActivity: number;
  updateActivity: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  lastActivity: Date.now(),
  updateActivity: () => set({ lastActivity: Date.now() }),
}));
