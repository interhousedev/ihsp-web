"use client"

import { getConfig } from "@ihsp/config"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { isPersistedQueryKey } from "../../offline/utils/persisted-queries"
import { registerServiceWorker } from "../utils/register-service-worker"
import { trackServiceWorkerRegistration } from "../utils/service-worker-registration"
import { parseSwEvent } from "../utils/sw-messages"

/**
 * Registers the service worker and listens to it: when it revalidated a cached answer (today, timetable, homework,
 * grades) and the fresh one differs from what the page was given, the page asks again and shows the new data.
 */
export function useServiceWorker(): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    const container = typeof navigator === "undefined" ? undefined : navigator.serviceWorker
    const config = getConfig()
    trackServiceWorkerRegistration(
      registerServiceWorker({
        apiUrl: config.API_URL,
        portalUrl: config.SP_URL,
        container,
        production: process.env.NODE_ENV === "production",
      }),
    )
    if (!container) return
    const onMessage = (event: MessageEvent) => {
      if (!parseSwEvent(event.data)) return
      void queryClient.invalidateQueries({ predicate: (query) => isPersistedQueryKey(query.queryKey) })
    }
    container.addEventListener("message", onMessage)
    return () => container.removeEventListener("message", onMessage)
  }, [queryClient])
}
