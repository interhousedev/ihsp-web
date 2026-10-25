"use client"

import { useCallback } from "react"
import { idErrorKey, idErrorValues } from "../utils/error-key"
import { useTr } from "./use-tr"

/** Returns a function that turns any thrown error into a translated, user-facing sentence. */
export function useErrorText(): (error: unknown) => string {
  const t = useTr()
  return useCallback(
    (error: unknown) =>
      t(
        idErrorKey(error, (key) => t.has(key)),
        idErrorValues(error),
      ),
    [t],
  )
}
