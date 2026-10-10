import { useAppLock as useSharedAppLock, type AppLock } from "@ihsp/features-core/pwa/lock"
import { loadOfflineSession } from "../utils/offline-session"

export type { AppLock }

export function useAppLock(): AppLock {
  return useSharedAppLock(() => loadOfflineSession()?.id ?? null)
}
