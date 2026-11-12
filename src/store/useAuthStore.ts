import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAppStore } from "@/store/useAppStore";

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isGithubUser: boolean;
  githubUsername: string | null;
  githubAvatar: string | null;
  isLoading: boolean;
  guestGithubUser: { username: string; avatarUrl: string } | null;

  // Actions
  initAuth: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signInMockGithub: (username: string) => void;
  signOut: () => Promise<void>;
  setUser: (user: User | null, session: Session | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      isGithubUser: false,
      githubUsername: null,
      githubAvatar: null,
      isLoading: true,
      guestGithubUser: null,

      initAuth: async () => {
        set({ isLoading: true });
        if (isSupabaseConfigured) {
          try {
            const { data } = await supabase.auth.getSession();
            const session = data.session;
            const user = session?.user || null;

            if (user) {
              const isGithub = user.app_metadata?.provider === "github" || Boolean(user.user_metadata?.user_name);
              const ghName = user.user_metadata?.user_name || user.user_metadata?.preferred_username || user.user_metadata?.full_name || user.email?.split("@")[0] || "contributor";
              const ghAvatar = user.user_metadata?.avatar_url || null;

              set({
                user,
                session,
                isAuthenticated: true,
                isGithubUser: isGithub,
                githubUsername: ghName,
                githubAvatar: ghAvatar,
                isLoading: false,
              });

              // Sync user preferences and glossaries from Supabase
              useAppStore.getState().syncUserSettings();
              useAppStore.getState().syncGlossaries();
            } else {
              // Check if guest GitHub user is persisted
              const guest = get().guestGithubUser;
              set({
                user: null,
                session: null,
                isAuthenticated: Boolean(guest),
                isGithubUser: Boolean(guest),
                githubUsername: guest?.username || null,
                githubAvatar: guest?.avatarUrl || null,
                isLoading: false,
              });
            }

            // Listen to auth changes
            supabase.auth.onAuthStateChange((_event, newSession) => {
              const newUser = newSession?.user || null;
              if (newUser) {
                const isGithub = newUser.app_metadata?.provider === "github" || Boolean(newUser.user_metadata?.user_name);
                const ghName = newUser.user_metadata?.user_name || newUser.user_metadata?.preferred_username || newUser.user_metadata?.full_name || newUser.email?.split("@")[0] || "contributor";
                const ghAvatar = newUser.user_metadata?.avatar_url || null;

                set({
                  user: newUser,
                  session: newSession,
                  isAuthenticated: true,
                  isGithubUser: isGithub,
                  githubUsername: ghName,
                  githubAvatar: ghAvatar,
                  isLoading: false,
                });

                // Sync user preferences and glossaries from Supabase
                useAppStore.getState().syncUserSettings();
                useAppStore.getState().syncGlossaries();
              } else {
                const guest = get().guestGithubUser;
                set({
                  user: null,
                  session: null,
                  isAuthenticated: Boolean(guest),
                  isGithubUser: Boolean(guest),
                  githubUsername: guest?.username || null,
                  githubAvatar: guest?.avatarUrl || null,
                  isLoading: false,
                });
              }
            });
          } catch (e) {
            console.error("Auth init error:", e);
            set({ isLoading: false });
          }
        } else {
          // If Supabase not configured, use persisted guest GitHub user if any
          const guest = get().guestGithubUser;
          set({
            isAuthenticated: Boolean(guest),
            isGithubUser: Boolean(guest),
            githubUsername: guest?.username || null,
            githubAvatar: guest?.avatarUrl || null,
            isLoading: false,
          });
        }
      },

      signInWithGithub: async () => {
        if (!isSupabaseConfigured) {
          // Fallback simulation for local dev
          const demoUsername = "contributor-dev";
          get().signInMockGithub(demoUsername);
          return;
        }

        const { error } = await supabase.auth.signInWithOAuth({
          provider: "github",
          options: {
            redirectTo: window.location.origin,
          },
        });

        if (error) {
          throw error;
        }
      },

      signInMockGithub: (username: string) => {
        const cleanName = username.trim().replace(/^@/, "") || "contributor";
        const guestData = {
          username: cleanName,
          avatarUrl: `https://github.com/${cleanName}.png`,
        };
        set({
          guestGithubUser: guestData,
          isAuthenticated: true,
          isGithubUser: true,
          githubUsername: cleanName,
          githubAvatar: guestData.avatarUrl,
        });
      },

      signOut: async () => {
        if (isSupabaseConfigured) {
          try {
            await supabase.auth.signOut();
          } catch (e) {
            console.error("Sign out error:", e);
          }
        }
        set({
          user: null,
          session: null,
          guestGithubUser: null,
          isAuthenticated: false,
          isGithubUser: false,
          githubUsername: null,
          githubAvatar: null,
        });
      },

      setUser: (user, session) => {
        const isGithub = user?.app_metadata?.provider === "github" || Boolean(user?.user_metadata?.user_name);
        const ghName = user?.user_metadata?.user_name || user?.user_metadata?.preferred_username || user?.user_metadata?.full_name || user?.email?.split("@")[0] || null;
        const ghAvatar = user?.user_metadata?.avatar_url || null;

        set({
          user,
          session,
          isAuthenticated: Boolean(user),
          isGithubUser: isGithub,
          githubUsername: ghName,
          githubAvatar: ghAvatar,
        });
      },
    }),
    {
      name: "po-translator-auth-session",
      partialize: (state) => ({
        guestGithubUser: state.guestGithubUser,
      }),
    }
  )
);
