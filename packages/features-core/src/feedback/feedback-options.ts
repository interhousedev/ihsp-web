import type { FeedbackArea, FeedbackKind } from "@ihsp/api"

/** The kinds in the order the selector shows them. */
export const FEEDBACK_KINDS: readonly FeedbackKind[] = ["bug", "idea", "other"]

/** The sections of the IHSP platform a report can be about. */
export const FEEDBACK_AREAS: readonly FeedbackArea[] = [
  "id",
  "my",
  "staff",
  "admin",
  "lms",
  "library",
  "share",
  "bot",
  "ai",
  "notebooks",
  "mail",
  "other",
]

/** Attachments are images only (the limit of ten is `FEEDBACK_MAX_ATTACHMENTS` in `@ihsp/api`). */
export const FEEDBACK_IMAGE_ACCEPT = "image/*"
