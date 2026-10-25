import { isApiError } from "@ihsp/api"
import { UploadRejectedError } from "./save-material"

/** The failures of an upload that get their own text (design § 7.4); everything else uses the generic message. */
export type UploadErrorKind =
  | "banned"
  | "rate-limited"
  | "duplicate"
  | "file-too-large"
  | "too-many-pages"
  | "not-editable"
  | "attestation-required"
  | "rejected"
  | "other"

export function classifyUploadError(error: unknown): UploadErrorKind {
  if (error instanceof UploadRejectedError) return "rejected"
  if (!isApiError(error)) return "other"
  switch (error.type) {
    case "library/banned":
      return "banned"
    case "library/rate-limited":
      return "rate-limited"
    case "library/duplicate":
      return "duplicate"
    case "library/file-too-large":
      return "file-too-large"
    case "library/too-many-pages":
      return "too-many-pages"
    case "library/not-editable":
      return "not-editable"
    case "library/attestation-required":
      return "attestation-required"
    default:
      return "other"
  }
}

/** A ban or a used-up daily limit stops the whole upload, so the wizard shows a panel instead of the step. */
export function isBlockingUploadError(error: unknown): boolean {
  const kind = classifyUploadError(error)
  return kind === "banned" || kind === "rate-limited"
}

/** `params.<name>` of an API error when it is a string. */
export function stringParam(error: unknown, name: string): string | undefined {
  if (!isApiError(error)) return undefined
  const value = error.params[name]
  return typeof value === "string" && value !== "" ? value : undefined
}

/** `params.<name>` of an API error when it is a number. */
export function numberParam(error: unknown, name: string): number | undefined {
  if (!isApiError(error)) return undefined
  const value = error.params[name]
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}
