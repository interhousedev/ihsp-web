"use client"

import { getMeCurriculumQuery } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"

/** The stored EMIS curriculum of the student's group; `data` is `null` while the group has none. */
export function useCurriculum() {
  return useQuery(getMeCurriculumQuery())
}
