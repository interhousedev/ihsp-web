"use client"

import { Button, cn, Icons } from "@ihsp/ui"
import type { ReactNode } from "react"

/** The title and one-line purpose that open every step of the essay flow. */
export function StepHead({ title, intro, children }: { title: string; intro: string; children?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-muted-foreground mt-0.5 max-w-prose text-sm">{intro}</p>
      </div>
      {children}
    </header>
  )
}

/** The way on to the next step; a suggestion, so it is a plain button and never blocks anything. */
export function StepNext({ label, onNext }: { label: string; onNext?: () => void }) {
  if (!onNext) return null
  return (
    <div className="flex justify-end pt-2">
      <Button onClick={onNext}>
        {label}
        <Icons.chevronRight aria-hidden />
      </Button>
    </div>
  )
}

export function Section({ title, hint, children, className }: { title: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-2", className)}>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
      </div>
      {children}
    </section>
  )
}
