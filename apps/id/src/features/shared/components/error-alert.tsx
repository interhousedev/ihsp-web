"use client"

import { Alert, AlertDescription } from "@ihsp/ui"
import { useEffect, useRef, type ReactNode } from "react"
import { useErrorText } from "../hooks/use-error-text"

/**
 * A failed request as an alert (`role="alert"`); renders nothing while there is no error. A new error is scrolled
 * into view and focused, so on a phone it does not stay hidden under the keyboard.
 */
export function ErrorAlert({ error }: { error: unknown }) {
  const errorText = useErrorText()
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const element = ref.current
    if (!error || !element) return
    element.scrollIntoView?.({ block: "nearest" })
    element.focus({ preventScroll: true })
  }, [error])
  if (!error) return null
  return (
    <Alert ref={ref} variant="destructive" role="alert" tabIndex={-1} className="outline-none">
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
