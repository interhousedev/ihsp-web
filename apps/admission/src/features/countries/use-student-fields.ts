"use client"

import { useProfile } from "../profile/api"

/** Study field names the student chose in the profile (questions q18 and q19). */
export function useStudentFields(): string[] {
  const answers = useProfile().data?.answers
  const pick = (id: string): string[] => {
    const value: unknown = answers?.[id]
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : []
  }
  return [...new Set([...pick("q18"), ...pick("q19")])].slice(0, 10)
}
