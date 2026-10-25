"use client"

import { getStaffLessonQuery } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"

/** `GET /v1/staff/lessons/{id}`; waits for an id (the address is read on the client). */
export function useStaffLesson(id: string | null) {
  return useQuery({ ...getStaffLessonQuery(id ?? ""), enabled: id !== null })
}
