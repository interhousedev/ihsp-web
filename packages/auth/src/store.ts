import type { UserMe } from "@ihsp/api"
import { setPreferredLocale } from "@ihsp/i18n"
import { create } from "zustand"

/** What `useSession()` returns for a logged-in user. `expires_at` is a Unix time in milliseconds. */
export type Session = { access_token: string; expires_at: number; user: UserMe }

export type AuthStatus = "loading" | "authenticated" | "anonymous"

type Token = { access_token: string; expires_at: number }

type AuthState = {
  status: AuthStatus
  token: Token | null
  user: UserMe | null
  /** The first refresh failed because the server was unreachable (the user may still be logged in). */
  networkError: boolean
  setToken: (token: Token) => void
  setUser: (user: UserMe) => void
  setAuthenticated: () => void
  setAnonymous: () => void
  setNetworkError: (value: boolean) => void
  clear: () => void
}

const initial = { status: "loading" as AuthStatus, token: null, user: null, networkError: false }

/** Access token and user live only in memory: this store is never persisted. */
export const useAuthStore = create<AuthState>()((set) => ({
  ...initial,
  setToken: (token) => set({ token }),
  setUser: (user) => {
    setPreferredLocale(user.preferences.locale)
    set({ user })
  },
  setAuthenticated: () => set({ status: "authenticated", networkError: false }),
  setAnonymous: () => set({ status: "anonymous", token: null, user: null, networkError: false }),
  setNetworkError: (networkError) => set({ networkError }),
  clear: () => set({ status: "anonymous", token: null, user: null, networkError: false }),
}))

export function getSession(): Session | null {
  const { token, user } = useAuthStore.getState()
  return token && user ? { access_token: token.access_token, expires_at: token.expires_at, user } : null
}

/** For tests and previews: puts a ready session into the store. */
export function setSession(session: Session | null): void {
  const state = useAuthStore.getState()
  if (!session) {
    state.clear()
    return
  }
  state.setToken({ access_token: session.access_token, expires_at: session.expires_at })
  state.setUser(session.user)
  state.setAuthenticated()
}

export function resetAuthStore(): void {
  useAuthStore.setState({ ...initial })
}
