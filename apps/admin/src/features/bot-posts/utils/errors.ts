import { isApiError } from "@ihsp/api"

export type BotPostErrorMessage = { key: string; values?: Record<string, string> }

const REASONS = ["empty", "language", "too-long", "format", "url", "too-many"] as const

/**
 * Maps a bot posts error to an i18n key of the `botPosts` namespace.
 * `posts/invalid` names the field and the reason (`{field, reason}` in `errors[0]`).
 * Anything else falls back to the generic message.
 */
export function botPostErrorMessage(error: unknown): BotPostErrorMessage {
  if (!isApiError(error)) return { key: "errors.generic" }
  switch (error.type) {
    case "posts/slug-taken":
      return { key: "errors.slugTaken" }
    case "posts/not-found":
      return { key: "errors.notFound" }
    case "posts/root-protected":
      return { key: "errors.rootProtected" }
    case "posts/has-children":
      return { key: "errors.hasChildren" }
    case "posts/cycle":
      return { key: "errors.cycle" }
    case "posts/reorder-mismatch":
      return { key: "errors.reorderMismatch" }
    case "posts/invalid": {
      const first = error.errors?.[0] as { field?: unknown; reason?: unknown } | undefined
      const reason = REASONS.find((item) => item === first?.reason)
      const field = typeof first?.field === "string" ? first.field : ""
      if (!reason) return { key: "errors.generic" }
      return { key: `errors.invalid.${reason}`, values: { field } }
    }
    default:
      return { key: "errors.generic" }
  }
}
