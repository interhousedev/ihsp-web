"use client"

import { useSession } from "@ihsp/auth"
import { NotFoundPage } from "@ihsp/ui"
import { AdmissionShell } from "../features/shell/components/admission-shell"

/**
 * Restoring the session applies the account language, so the 404 speaks the language of the rest of the app.
 * A signed-in user sees it inside the app shell; a signed-out visitor gets the bare page (the shell would send them
 * to sign-in instead of telling them the address is wrong).
 */
export default function NotFound() {
  const { status } = useSession()
  if (status !== "authenticated") return <NotFoundPage />
  return (
    <AdmissionShell anyone>
      <NotFoundPage />
    </AdmissionShell>
  )
}
