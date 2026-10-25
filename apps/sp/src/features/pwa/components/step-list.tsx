import type { ComponentType } from "react"

export type Step = {
  icon: ComponentType<{ className?: string }>
  text: string
}

/** Numbered instructions with an icon per step, for the pages that tell people where to tap. */
export function StepList({ steps }: { steps: Step[] }) {
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((step, index) => (
        <li key={step.text} className="bg-card flex items-center gap-3 rounded-xl border p-3">
          <span
            aria-hidden
            className="bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
          >
            {index + 1}
          </span>
          <span className="flex-1 text-sm leading-snug">{step.text}</span>
          <step.icon aria-hidden className="text-muted-foreground size-6 shrink-0" />
        </li>
      ))}
    </ol>
  )
}
