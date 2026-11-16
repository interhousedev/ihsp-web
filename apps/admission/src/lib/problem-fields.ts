import { isApiError } from "@ihsp/api"
import { toast } from "sonner"

/** A server validation problem tied to one form field, with the backend's localized title. */
export type FieldProblem = { field: string; title: string }

/** Stable toast id so a later success can clear a stale error toast. */
export const PROBLEM_TOAST_ID = "admission-problem"

/** Maps a problem+json 422 `{title, params.field}` to a field error; null for any other error. */
export function problemField(error: unknown): FieldProblem | null {
  if (!isApiError(error) || error.status !== 422 || !error.title) return null
  const { field } = error.params
  return typeof field === "string" && field ? { field, title: error.title } : null
}

/** Title of the problem for `name` (exact field or a nested path such as `links.0.url`), else undefined. */
export function fieldMessage(problem: FieldProblem | null, ...names: string[]): string | undefined {
  if (!problem) return undefined
  return names.some((name) => problem.field === name || problem.field.startsWith(`${name}.`))
    ? problem.title
    : undefined
}

/**
 * Like `fieldMessage`, but prefers the app's own copy for the exact failing field (`copy` is keyed by the backend's
 * field name) over the backend's generic English title.
 */
export function fieldCopy(
  problem: FieldProblem | null,
  copy: Readonly<Record<string, string>>,
  ...names: string[]
): string | undefined {
  const title = fieldMessage(problem, ...names)
  return title === undefined || problem === null ? undefined : (copy[problem.field] ?? title)
}

/** Shows a failure as a toast under one id, so repeats replace each other. */
export function showProblemToast(message: string): void {
  toast.error(message, { id: PROBLEM_TOAST_ID })
}

/** Clears a stale error toast after a successful save. */
export function clearProblemToast(): void {
  toast.dismiss(PROBLEM_TOAST_ID)
}
