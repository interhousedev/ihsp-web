"use client"

import { Spinner } from "@ihsp/ui"

/** Centered spinner with an optional line of text, used while the session is being restored. */
export function FullScreenSpinner({ text }: { text?: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-4">
      <Spinner className="size-8" />
      {text ? <p className="text-muted-foreground text-sm">{text}</p> : null}
    </div>
  )
}
