import { create } from "zustand";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "CASHIER";
}

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        set({ error: data.error || "Login failed", loading: false });
        return false;
      }

      set({ user: data.user, loading: false });
      return true;
    } catch (err) {
      set({ error: "Network error occurred", loading: false });
      return false;
    }
  },
  logout: async () => {
    set({ loading: true });
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      set({ user: null, loading: false });
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  },
  checkSession: async () => {
    set({ loading: true });
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        set({ user: data.user, loading: false });
      } else {
        set({ user: null, loading: false });
      }
    } catch (err) {
      set({ user: null, loading: false });
    }
  },
}));
