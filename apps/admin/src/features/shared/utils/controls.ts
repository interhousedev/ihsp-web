import type { AssessmentKind, ControlName } from "@ihsp/api"

/** The control weeks of a term in calendar order: two midterm controls, then the final. */
export const CONTROL_NAMES = ["midterm_1", "midterm_2", "final"] as const satisfies readonly ControlName[]

/** The kind of control a week is for (the backend refuses a midterm in the final week and the reverse). */
export function controlKind(name: ControlName): Exclude<AssessmentKind, "other"> {
  return name === "final" ? "final" : "midterm"
}

/** Whether `kind` may be held in the week `control`; `other` controls are held outside the control weeks. */
export function kindFitsControl(kind: AssessmentKind, control: ControlName | null): boolean {
  return control === null || controlKind(control) === kind
}
