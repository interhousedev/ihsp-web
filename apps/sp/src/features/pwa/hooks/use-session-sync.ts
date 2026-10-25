"use client"

import { useAuthStore } from "@ihsp/auth"
import { useEffect } from "react"
import { clearPersistedQueries } from "../../offline/utils/persisted-queries"
import { OFFLINE_TOKEN, clearOfflineSession, loadOfflineSession } from "../utils/offline-session"
import { clearPinRecord } from "../utils/pin-storage"
import { postToWorker } from "../utils/post-to-worker"
import { sessionTransition, type SessionView } from "../utils/session-transition"
import { SW_MESSAGE } from "../utils/sw-messages"

function viewOf(state: ReturnType<typeof useAuthStore.getState>): SessionView {
  return { status: state.status, userId: state.user?.id ?? null, offline: state.token?.access_token === OFFLINE_TOKEN }
}

/**
 * Keeps the worker and the stored data in step with the session. The worker caches API answers per user, so it must
 * know who is signed in; when the session ends, every stored answer (query cache, remembered user, PIN, worker caches)
 * goes.
 * It subscribes to the store itself instead of reacting in a render, because a logout navigates away at once.
 */
export function useSessionSync(): void {
  useEffect(() => {
    let previous: SessionView = { status: "loading", userId: null, offline: false }
    const apply = (next: SessionView) => {
      const action = sessionTransition(previous, next)
      const endedUserId = previous.userId ?? loadOfflineSession()?.id ?? null
      previous = next
      if (action === "set-user" && next.userId) postToWorker({ type: SW_MESSAGE.setUser, userId: next.userId })
      if (action === "clear") {
        postToWorker({ type: SW_MESSAGE.clearUser })
        clearPersistedQueries()
        // The PIN belongs to the session: a new sign-in starts without one (and "Forgot PIN" works by signing out).
        clearPinRecord(endedUserId)
        clearOfflineSession()
      }
    }
    // A store that is already signed in when this mounts counts as a session that just started.
    apply(viewOf(useAuthStore.getState()))
    return useAuthStore.subscribe((state) => apply(viewOf(state)))
  }, [])
}
