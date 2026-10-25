"use client"

import {
  getAdminGroupsQuery,
  getAdminRoomsQuery,
  getAdminSubjectsQuery,
  getAdminTeachers,
  getAdminTermsQuery,
  keys,
  type AdminUser,
} from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"
import { fetchAllPages } from "../utils/fetch-all-pages"

/** Active groups for pickers and filters. */
export function useGroupOptions() {
  return useQuery(getAdminGroupsQuery({ status: "active" }))
}

/** Every teacher (all pages) for pickers and filters. */
export function useTeacherOptions() {
  return useQuery<AdminUser[]>({
    queryKey: keys.admin.teachers.list({ all: true }),
    queryFn: () => fetchAllPages((cursor) => getAdminTeachers({ cursor, limit: 100 })),
    staleTime: 60_000,
  })
}

export function useSubjectOptions() {
  return useQuery(getAdminSubjectsQuery())
}

export function useRoomOptions() {
  return useQuery(getAdminRoomsQuery({ status: "active" }))
}

export function useTerms() {
  return useQuery(getAdminTermsQuery())
}
