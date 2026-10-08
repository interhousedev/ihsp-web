import type { ReactNode } from "react"

/**
 * Gives a learner page Stepik's green accent (`.lms-stepik` in `app/stepik.css`) without touching the theme of the
 * editor pages. It fills the shell's content area like the page it wraps.
 */
export function StepikScope({ children }: { children: ReactNode }) {
  return <div className="lms-stepik flex min-w-0 flex-1 flex-col">{children}</div>
}
