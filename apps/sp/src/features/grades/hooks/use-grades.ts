"use client"

import { getMeGradesDayQuery, getMeGradesQuery, getMeLessonResultsQuery, getMeRecordBookQuery } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"

export function useSemesterGrades(semester: number | undefined) {
  return useQuery(getMeGradesQuery(semester ? { semester } : undefined))
}

export function useDayGrades(date: string) {
  return useQuery(getMeGradesDayQuery(date))
}

/** Attendance and mark of each lesson of one day (the lessons that have started). */
export function useDayLessonResults(date: string) {
  return useQuery(getMeLessonResultsQuery({ from: date, to: date }))
}

export function useRecordBook() {
  return useQuery(getMeRecordBookQuery())
}
