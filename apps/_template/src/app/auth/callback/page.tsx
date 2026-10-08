"use client"

import { AuthCallback } from "@ihsp/auth"

/** OAuth redirect target (`/auth/callback/`): finishes the login and continues where the user was. */
export default function AuthCallbackPage() {
  return <AuthCallback />
}
