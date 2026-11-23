import { z } from "zod"

export const SLUG_PATTERN = /^[a-z0-9-]{3,60}$/

/** The new-course form (backend: slug `[a-z0-9-]{3,60}`, unique). */
export const courseFormSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z.string().regex(SLUG_PATTERN),
  visibility: z.enum(["public", "invite"]),
})

export type CourseFormValues = z.infer<typeof courseFormSchema>
