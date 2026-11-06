"use client"

import { ErrorPage } from "@ihsp/ui"

/** Catches a crash below the root layout, so the providers and the locale are still there. */
export default function AppError({ reset }: { reset: () => void }) {
  return <ErrorPage onRetry={reset} />
}
