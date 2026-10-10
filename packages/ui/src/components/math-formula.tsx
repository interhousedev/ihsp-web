"use client"

import { useT } from "@ihsp/i18n"
import { IconAlertTriangle } from "./icons"
import { useLayoutEffect, useRef, useState } from "react"
import { describeMathError, MATH_OPTIONS, useKatex } from "../hooks/use-katex"
import { cn } from "../lib/utils"

/**
 * A LaTeX formula rendered with KaTeX (inline, or display: centred on its own line, scrolling sideways when wide).
 * KaTeX builds DOM nodes itself (no HTML strings) and reads `MATH_OPTIONS` (no links or HTML from formulas). Invalid
 * LaTeX shows the source with the reason instead of crashing; while KaTeX loads, the source is shown as code.
 */
export function MathFormula({
  source,
  display = false,
  className,
}: {
  source: string
  display?: boolean
  className?: string
}) {
  const katex = useKatex()
  const target = useRef<HTMLSpanElement>(null)
  const [error, setError] = useState<string | null>(null)

  useLayoutEffect(() => {
    const element = target.current
    if (!katex || !element) return
    try {
      katex.render(source, element, { ...MATH_OPTIONS, displayMode: display })
      setError(null)
    } catch (caught) {
      element.textContent = ""
      setError(describeMathError(caught))
    }
  }, [katex, source, display])

  const frame = cn(display ? "my-3 block max-w-full overflow-x-auto overflow-y-hidden" : "inline", className)
  if (!katex) {
    return (
      <span className={frame} data-math={display ? "display" : "inline"}>
        <code className="text-muted-foreground font-mono text-[0.85em]">{source}</code>
      </span>
    )
  }
  return (
    <span className={frame} data-math={display ? "display" : "inline"}>
      <span ref={target} hidden={error !== null} />
      {error !== null ? <MathError source={source} message={error} display={display} /> : null}
    </span>
  )
}

function MathError({ source, message, display }: { source: string; message: string; display: boolean }) {
  const t = useT()
  const label = t("markdown.mathError", { message })
  if (!display) {
    return (
      <span
        title={label}
        data-math-error=""
        className="border-destructive/40 bg-destructive/10 text-destructive inline-flex items-baseline gap-1 rounded border border-dashed px-1 font-mono text-[0.85em]"
      >
        <IconAlertTriangle aria-hidden className="size-3.5 shrink-0 self-center" />
        <span className="sr-only">{label}</span>
        <span className="break-all">{source}</span>
      </span>
    )
  }
  return (
    <span
      data-math-error=""
      className="border-destructive/40 bg-destructive/10 text-destructive block rounded-md border border-dashed p-3 text-sm"
    >
      <span className="flex items-center gap-1.5 font-medium">
        <IconAlertTriangle aria-hidden className="size-4 shrink-0" />
        {label}
      </span>
      <code className="mt-1 block font-mono text-xs break-all whitespace-pre-wrap">{source}</code>
    </span>
  )
}
