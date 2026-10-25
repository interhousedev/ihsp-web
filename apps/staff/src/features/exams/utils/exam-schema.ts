import { z } from "zod"
import { kindMatchesControl } from "./exam-form"
import { isTime } from "./exam-time"

export const TITLE_MAX = 200
export const NOTE_MAX = 2000

export type ExamValidationMessages = {
  subject: string
  date: string
  time: string
  title: string
  note: string
  control: string
}

/** The rules of the exam form (the backend allows a title up to 200 and a note up to 2000 characters). */
export function examSchema(messages: ExamValidationMessages) {
  return z
    .object({
      subjectId: z.string().min(1, messages.subject),
      subgroup: z.enum(["", "1", "2"]),
      kind: z.enum(["midterm", "final", "other"]),
      control: z.enum(["", "midterm_1", "midterm_2", "final"]),
      date: z.string().min(1, messages.date),
      time: z.string().refine((value) => value === "" || isTime(value), messages.time),
      room: z.string(),
      title: z.string().refine((value) => value.trim().length <= TITLE_MAX, messages.title),
      note: z.string().refine((value) => value.trim().length <= NOTE_MAX, messages.note),
    })
    .refine((values) => kindMatchesControl(values.kind, values.control), {
      message: messages.control,
      path: ["control"],
    })
}
