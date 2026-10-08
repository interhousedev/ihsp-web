"use client"

import { getMeProfileQuery, getMeSubjectQuery, getMeSubjectsQuery } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"

/** `semester` undefined means the current semester (the server decides). */
export function useSubjects(semester: number | undefined) {
  return useQuery(getMeSubjectsQuery(semester ? { semester } : undefined))
}

export function useSubject(id: string | null, semester: number | undefined) {
  return useQuery({ ...getMeSubjectQuery(id ?? "", semester ? { semester } : undefined), enabled: id !== null })
}

export function useCurrentSemester(): number | null {
  return useQuery(getMeProfileQuery()).data?.current_semester ?? null
}
