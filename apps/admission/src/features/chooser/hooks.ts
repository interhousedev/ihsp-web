"use client"

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import { EMPTY_FILTERS, type Filters } from "./filters"
import { deriveFacets } from "./facets"
import {
  addToList,
  checkAffordability,
  getInstitution,
  getList,
  getScholarships,
  patchListEntry,
  postSummary,
  removeListEntry,
  requestSignOff,
  searchInstitutions,
  type ScholarshipFilters,
} from "./api"
import type { ListEntry, ListPatchBody } from "./types"

/** Page size of the catalog search; the backend allows 1 to 50. */
export const PAGE_SIZE = 20
/** Facets are read from the largest page the backend serves. */
const FACET_LIMIT = 50

const KEYS = {
  search: (filters: Filters) => ["admission", "catalog", "search", filters] as const,
  facets: ["admission", "catalog", "facets"] as const,
  institution: (id: string) => ["admission", "catalog", "institution", id] as const,
  scholarships: (filters: ScholarshipFilters) => ["admission", "catalog", "scholarships", filters] as const,
  list: ["admission", "list"] as const,
}

export function useInstitutionSearch(filters: Filters) {
  return useInfiniteQuery({
    queryKey: KEYS.search(filters),
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => searchInstitutions(filters, pageParam, PAGE_SIZE, signal),
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  })
}

/** Filter options and the filters without any data, from an unfiltered catalog page. */
export function useFacets() {
  const query = useQuery({
    queryKey: KEYS.facets,
    queryFn: ({ signal }) => searchInstitutions(EMPTY_FILTERS, 0, FACET_LIMIT, signal),
    staleTime: 5 * 60_000,
  })
  const facets = useMemo(() => (query.data ? deriveFacets(query.data.items) : null), [query.data])
  return { facets, isLoading: query.isLoading }
}

export function useInstitution(id: string | null) {
  return useQuery({
    queryKey: KEYS.institution(id ?? ""),
    queryFn: ({ signal }) => getInstitution(id as string, signal),
    enabled: Boolean(id),
  })
}

export function useSummary(id: string, language: string) {
  return useMutation({ mutationFn: () => postSummary(id, language) })
}

export function useScholarships(filters: ScholarshipFilters) {
  return useQuery({ queryKey: KEYS.scholarships(filters), queryFn: ({ signal }) => getScholarships(filters, signal) })
}

export function useList() {
  return useQuery({ queryKey: KEYS.list, queryFn: ({ signal }) => getList(signal) })
}

/** Puts a changed entry into the cached list (the server's answer carries the new `lock_version`). */
function useListWriter() {
  const client = useQueryClient()
  return (entry: ListEntry) =>
    client.setQueryData<ListEntry[]>(KEYS.list, (current) => {
      const list = current ?? []
      return list.some((item) => item.id === entry.id)
        ? list.map((item) => (item.id === entry.id ? entry : item))
        : [...list, entry]
    })
}

export function useAddToList() {
  const write = useListWriter()
  return useMutation({ mutationFn: addToList, onSuccess: write })
}

export function usePatchEntry() {
  const write = useListWriter()
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ListPatchBody }) => patchListEntry(id, body),
    onSuccess: write,
    // 409: somebody changed the entry; reload the list for the new lock_version.
    onError: () => client.invalidateQueries({ queryKey: KEYS.list }),
  })
}

export function useRemoveEntry() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: removeListEntry,
    onSuccess: (_, id) =>
      client.setQueryData<ListEntry[]>(KEYS.list, (current) => (current ?? []).filter((item) => item.id !== id)),
  })
}

export function useAffordability() {
  const client = useQueryClient()
  return {
    check: useMutation({
      mutationFn: checkAffordability,
      onSettled: () => client.invalidateQueries({ queryKey: KEYS.list }),
    }),
    signOff: useMutation({
      mutationFn: requestSignOff,
      onSettled: () => client.invalidateQueries({ queryKey: KEYS.list }),
    }),
  }
}
