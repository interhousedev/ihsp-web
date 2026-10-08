"use client"

import { Alert, AlertDescription } from "@ihsp/ui"
import type { ReactNode } from "react"
import { useErrorText } from "../hooks/use-error-text"

/** A failed request as an alert (`role="alert"`); renders nothing while there is no error. */
export function ErrorAlert({ error }: { error: unknown }) {
  const errorText = useErrorText()
  if (!error) return null
  return (
    <Alert variant="destructive">
      <AlertDescription>{errorText(error)}</AlertDescription>
    </Alert>
  )
}

/** A neutral notice (for example "If OTP is enabled, we sent a code"). */
export function InfoAlert({ children }: { children: ReactNode }) {
  return (
    <Alert role="status">
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  )
}
