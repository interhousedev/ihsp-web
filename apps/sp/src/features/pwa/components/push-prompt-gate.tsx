"use client"

import { useSession } from "@ihsp/auth"
import { PushPrompt } from "@ihsp/features-core"
import { getServiceWorkerRegistration } from "../utils/service-worker-registration"

/**
 * Offers push notifications once the user is signed in: in the installed app it asks (iOS allows that only from a tap
 * inside the Home Screen app); on an iPhone in Safari it explains that the app has to be on the Home Screen first.
 */
export function PushPromptGate() {
  const { status } = useSession()
  if (status !== "authenticated") return null
  return <PushPrompt getRegistration={getServiceWorkerRegistration} />
}
