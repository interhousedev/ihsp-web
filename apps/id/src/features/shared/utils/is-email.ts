import { z } from "zod"

const emailSchema = z.email()

export function isEmail(value: string): boolean {
  return emailSchema.safeParse(value.trim()).success
}
