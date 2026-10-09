"use client"

import type { ControlName } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useCallback } from "react"

/** The name of a control week in the user's language: "Midterm 1", "Midterm 2", "Final". */
export function useControlLabel(): (name: ControlName) => string {
  const t = useT("shared.controls")
  return useCallback((name: ControlName) => t(name), [t])
}
