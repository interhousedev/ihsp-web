"use client"

import { getMeTeacherQuery, getMeTeacherTimetableQuery } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"

const REFRESH_MS = 60_000

/** One teacher of the student's groups; refreshed every minute like the list, so "the nearest class" stays right. */
export function useMyTeacher(id: string | null) {
  return useQuery({ ...getMeTeacherQuery(id ?? ""), enabled: id !== null && id !== "", refetchInterval: REFRESH_MS })
}

/** The teacher's lessons in every group between two ISO dates (inclusive). */
export function useTeacherTimetable(teacherId: string, from: string, to: string) {
  return useQuery(getMeTeacherTimetableQuery(teacherId, { from, to }))
}
