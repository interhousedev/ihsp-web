import { IconCheck, cn } from "@ihsp/ui"
import type { ReactNode } from "react"
import { Reveal } from "./reveal"

/** One feature: a heading with three points beside the device that shows it. */
export function FeatureSection({
  id,
  title,
  text,
  points,
  reverse,
  tint,
  children,
}: {
  id: string
  title: string
  text: string
  points: string[]
  reverse?: boolean
  tint?: boolean
  children: ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn("scroll-mt-24 px-4 py-12 sm:py-24", tint && "bg-muted/40")}
    >
      <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-2 lg:gap-16">
        <Reveal className={cn(reverse && "lg:order-2")}>
          <h2
            id={`${id}-title`}
            className="text-2xl font-bold tracking-tight text-balance min-[400px]:text-3xl sm:text-4xl"
          >
            {title}
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">{text}</p>
          <ul className="mt-6 grid gap-3">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand-text)]">
                  <IconCheck aria-hidden className="size-4" />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={150} className="flex min-w-0 items-center justify-center">
          {children}
        </Reveal>
      </div>
    </section>
  )
}
