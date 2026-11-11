import { cn } from "@ihsp/ui"
import "./backdrop.css"

/**
 * A decorative animated background for a section: drifting brand blobs, an optional faded grid and a slow light
 * beam. GPU-friendly (transform and opacity only), static under `prefers-reduced-motion`, hidden from assistive tech.
 *
 * Use it inside an `isolate relative overflow-hidden` section as its first child:
 * `<section className="relative isolate overflow-hidden"><AnimatedBackdrop grid /> ...content...</section>`.
 */
export function AnimatedBackdrop({
  grid = false,
  beam = false,
  tone = "soft",
  className,
}: {
  /** Draw a faded grid under the blobs. */
  grid?: boolean
  /** Add a slow light beam sweeping across. */
  beam?: boolean
  tone?: "soft" | "strong"
  className?: string
}) {
  return (
    <div aria-hidden className={cn("backdrop", className)} data-tone={tone}>
      <span className="backdrop-blob backdrop-blob--a" />
      <span className="backdrop-blob backdrop-blob--b" />
      <span className="backdrop-blob backdrop-blob--c" />
      {grid && <span className="backdrop-grid" />}
      {beam && <span className="backdrop-beam" />}
    </div>
  )
}
