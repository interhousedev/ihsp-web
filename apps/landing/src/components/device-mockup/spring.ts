/**
 * A damped spring sampled into a CSS `linear()` easing, so plain CSS transitions can move on springs
 * without a runtime dependency. Deterministic: the server and the browser produce the same string.
 */
export interface SpringConfig {
  readonly stiffness: number
  readonly damping: number
  readonly mass?: number
}

export interface SpringEasing {
  /** CSS `linear(...)` timing function. */
  readonly easing: string
  /** Settling time in milliseconds. */
  readonly duration: number
}

const STEP = 1 / 240
const MAX_SECONDS = 3

function trace({ stiffness, damping, mass = 1 }: SpringConfig): { samples: number[]; seconds: number } {
  const samples: number[] = []
  let position = 0
  let velocity = 0
  let time = 0
  for (; time < MAX_SECONDS; time += STEP) {
    samples.push(position)
    const force = -stiffness * (position - 1) - damping * velocity
    velocity += (force / mass) * STEP
    position += velocity * STEP
    if (Math.abs(position - 1) < 0.0005 && Math.abs(velocity) < 0.005) break
  }
  samples.push(1)
  return { samples, seconds: time }
}

export function springEasing(config: SpringConfig, points = 48): SpringEasing {
  const { samples, seconds } = trace(config)
  const sample = (progress: number) => {
    if (progress <= 0) return 0
    if (progress >= 1) return 1
    const at = progress * (samples.length - 1)
    const low = Math.floor(at)
    const from = samples[low] ?? 1
    return from + ((samples[low + 1] ?? from) - from) * (at - low)
  }
  const stops: string[] = []
  for (let index = 0; index <= points; index += 1) {
    stops.push(index === points ? "1" : String(Math.round(sample(index / points) * 10000) / 10000))
  }
  return { easing: `linear(${stops.join(", ")})`, duration: Math.round(seconds * 1000) }
}
