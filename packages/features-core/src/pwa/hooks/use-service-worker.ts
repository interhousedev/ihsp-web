"use client"

import { getConfig } from "@ihsp/config"
import { useEffect, useRef } from "react"
import { pwaAppId } from "../utils/app-id"
import { registerServiceWorker } from "../utils/register-service-worker"
import { trackServiceWorkerRegistration } from "../utils/service-worker-registration"
import { parseSwEvent } from "../sw/sw-messages"

export type ServiceWorkerOptions = {
  /**
   * The worker revalidated a cached API answer and the fresh one differs from what the page was given (only the student app
   * keeps API answers): ask again and show the new data.
   */
  onApiUpdated?: () => void
}

/** Registers the app's service worker (`/sw.js`) and listens to it. Call it once, in pwa mode. */
export function useServiceWorker({ onApiUpdated }: ServiceWorkerOptions = {}): void {
  const latest = useRef(onApiUpdated)
  useEffect(() => {
    latest.current = onApiUpdated
  })

  useEffect(() => {
    const container = typeof navigator === "undefined" ? undefined : navigator.serviceWorker
    const config = getConfig()
    trackServiceWorkerRegistration(
      registerServiceWorker({
        apiUrl: config.API_URL,
        portalUrl: config.SP_URL,
        appId: pwaAppId() ?? undefined,
        container,
        production: process.env.NODE_ENV === "production",
      }),
    )
    if (!container) return
    const onMessage = (event: MessageEvent) => {
      if (parseSwEvent(event.data)) latest.current?.()
    }
    container.addEventListener("message", onMessage)
    return () => container.removeEventListener("message", onMessage)
  }, [])
}
