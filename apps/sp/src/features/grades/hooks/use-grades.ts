"use client"

import { getMeGradesDayQuery, getMeGradesQuery, getMeRecordBookQuery } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"

export function useSemesterGrades(semester: number | undefined) {
  return useQuery(getMeGradesQuery(semester ? { semester } : undefined))
}

export function useDayGrades(date: string) {
  return useQuery(getMeGradesDayQuery(date))
}

export function useRecordBook() {
  return useQuery(getMeRecordBookQuery())
}
