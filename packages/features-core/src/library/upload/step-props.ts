import type { MaterialValues } from "./material-values"

/** What every step of the wizard gets. */
export type StepProps = {
  values: MaterialValues
  onChange: (patch: Partial<MaterialValues>) => void
  /** Show the messages for the open problems of this step (after a failed Next). */
  showProblems: boolean
}
