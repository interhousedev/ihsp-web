"use client"

import type { KatexOptions } from "katex"
import { useEffect, useState } from "react"

export type Katex = typeof import("katex").default

/**
 * KaTeX settings for formulas written by users: no `\href`, `\url`, `\includegraphics` or HTML extensions (`trust`),
 * capped sizes and macro expansion, and no console warnings for text in other alphabets inside math (`strict`).
 */
export const MATH_OPTIONS: KatexOptions = {
  throwOnError: true,
  trust: false,
  strict: "ignore",
  maxSize: 50,
  maxExpand: 1000,
  output: "htmlAndMathml",
}

let loaded: Katex | null = null
let loading: Promise<Katex> | null = null

/** Loads KaTeX once, on the first formula (it is a separate chunk, so pages without math don't download it). */
export function loadKatex(): Promise<Katex> {
  loading ??= import("katex").then(
    (module) => {
      loaded = module.default
      return module.default
    },
    (error: unknown) => {
      loading = null
      throw error
    },
  )
  return loading
}

/** KaTeX once it has loaded; `null` while loading or when the chunk could not be loaded (offline). */
export function useKatex(): Katex | null {
  const [katex, setKatex] = useState<Katex | null>(loaded)
  useEffect(() => {
    if (katex) return
    let live = true
    loadKatex().then(
      (module) => {
        if (live) setKatex(() => module)
      },
      () => undefined,
    )
    return () => {
      live = false
    }
  }, [katex])
  return katex
}

/** The reason KaTeX can't render `source`, or `null` when it can. */
export function mathError(katex: Katex, source: string, display: boolean): string | null {
  try {
    katex.renderToString(source, { ...MATH_OPTIONS, displayMode: display })
    return null
  } catch (error) {
    return describeMathError(error)
  }
}

export function describeMathError(error: unknown): string {
  if (error instanceof Error && error.name === "ParseError" && "rawMessage" in error) return String(error.rawMessage)
  return error instanceof Error ? error.message : String(error)
}
