"use client"

import { normalizeStudyGroups } from "./study-label"
import { useInfiniteQuery, useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query"
import { getApiClient } from "@ihsp/api"
import { useLocale, useT } from "@ihsp/i18n"
import { toast } from "sonner"
import { useMemo } from "react"
import type { Filters } from "./filters"
import { tidyStudyGroups, toFacets } from "./facets"
import { distinctConflicts, newConflicts, useConflictText } from "./components/list-conflicts"
import {
  addToList,
  checkAffordability,
  getFacets,
  getInstitution,
  getList,
  getScholarships,
  getStudyFields,
  getUniSuggestions,
  patchListEntry,
  postSummary,
  removeListEntry,
  requestSignOff,
  searchInstitutions,
  searchInstitutionsByText,
  type ScholarshipFilters,
} from "./api"
import type { ListEntry, ListPatchBody } from "./types"

/** Page size of the catalog search; the backend allows 1 to 50. */
export const PAGE_SIZE = 20

const KEYS = {
  search: (filters: Filters, locale: string) => ["admission", "catalog", "search", filters, locale] as const,
  facets: (locale: string) => ["admission", "catalog", "facets", locale] as const,
  studyFields: (locale: string) => ["admission", "catalog", "study-fields", locale] as const,
  institution: (id: string, locale: string) => ["admission", "catalog", "institution", id, locale] as const,
  scholarships: (filters: ScholarshipFilters, locale: string) =>
    ["admission", "catalog", "scholarships", filters, locale] as const,
  list: ["admission", "list"] as const,
}

export function useInstitutionSearch(filters: Filters) {
  const locale = useLocale()
  return useInfiniteQuery({
    queryKey: KEYS.search(filters, locale),
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => searchInstitutions(filters, pageParam, PAGE_SIZE, locale, signal),
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  })
}

/** Picker results for the typed text (the caller debounces); `limit` matches. */
export function useInstitutionPickerSearch(q: string, limit: number, enabled = true) {
  const locale = useLocale()
  return useQuery({
    queryKey: ["admission", "catalog", "picker", q, limit, locale] as const,
    queryFn: ({ signal }) => searchInstitutionsByText(q, limit, locale, signal),
    enabled,
    staleTime: 60_000,
  })
}

/** Institutions by id (the detail endpoint, shared with the detail page's cache), in the order of `ids`. */
export function useInstitutionsByIds(ids: string[]) {
  const locale = useLocale()
  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: KEYS.institution(id, locale),
      queryFn: ({ signal }: { signal: AbortSignal }) => getInstitution(id, locale, signal),
      staleTime: 5 * 60_000,
    })),
  })
  return {
    institutions: results.flatMap((result) => (result.data ? [result.data] : [])),
    isLoading: results.some((result) => result.isLoading),
  }
}

/** The catalog's filters with localized labels and options (`GET /catalog/facets`). */
export function useFacets() {
  const locale = useLocale()
  const query = useQuery({
    queryKey: KEYS.facets(locale),
    queryFn: ({ signal }) => getFacets(locale, signal),
    staleTime: 5 * 60_000,
  })
  const facets = useMemo(() => (query.data ? toFacets(query.data) : null), [query.data])
  return { facets, isLoading: query.isLoading }
}

/** Fields of study grouped by family, sorted and deduplicated (`GET /catalog/study-fields`). */
export function useStudyFields() {
  const locale = useLocale()
  const query = useQuery({
    queryKey: KEYS.studyFields(locale),
    queryFn: ({ signal }) => getStudyFields(locale, signal),
    staleTime: 30 * 60_000,
  })
  const groups = useMemo(
    () => (query.data ? normalizeStudyGroups(tidyStudyGroups(query.data), locale) : []),
    [query.data, locale],
  )
  return { groups, isLoading: query.isLoading }
}

export function useInstitution(id: string | null) {
  const locale = useLocale()
  return useQuery({
    queryKey: KEYS.institution(id ?? "", locale),
    queryFn: ({ signal }) => getInstitution(id as string, locale, signal),
    enabled: Boolean(id),
  })
}

export function useSummary(id: string, language: string) {
  return useMutation({ mutationFn: () => postSummary(id, language) })
}

export function useScholarships(filters: ScholarshipFilters) {
  const locale = useLocale()
  return useQuery({
    queryKey: KEYS.scholarships(filters, locale),
    queryFn: ({ signal }) => getScholarships(filters, locale, signal),
  })
}

export function useList() {
  return useQuery({ queryKey: KEYS.list, queryFn: ({ signal }) => getList(signal) })
}

export type ListInsights = {
  entries: {
    entry_id: string
    institution_id: string
    classification: { effective: string | null; source: string; reasons: string[] }
  }[]
  balance: { reach: number; target: number; safety: number; unlabelled: number; status: string }
}

/** The backend's classification of the list: the one source of every reach/target/safety label and count. */
export function useListInsights() {
  const list = useList()
  return useQuery({
    queryKey: ["admission", "list-insights", list.data],
    queryFn: () => getApiClient().get<ListInsights>("/v1/admission/list/insights"),
  })
}

/** The label in force for an entry (staff, student or computed); the student's own bucket until insights arrive. */
export function useEntryLabel(): (entry: ListEntry) => string | null {
  const insights = useListInsights()
  const byEntry = new Map((insights.data?.entries ?? []).map((row) => [row.entry_id, row.classification.effective]))
  return (entry) => (byEntry.has(entry.id) ? (byEntry.get(entry.id) ?? null) : entry.bucket)
}

/**
 * Puts a changed entry into the cached list (the server's answer carries the new `lock_version`).
 * A conflict the answer introduces raises a warning toast; it never blocks the change. The other entries'
 * conflicts moved with it, so the list is reloaded.
 */
function useListWriter() {
  const client = useQueryClient()
  const t = useT("chooser")
  const conflictText = useConflictText()
  return (entry: ListEntry) => {
    const before = client.getQueryData<ListEntry[]>(KEYS.list) ?? []
    const known = distinctConflicts(before.map((item) => (item.id === entry.id ? { ...item, conflicts: [] } : item)))
    const previous = before.find((item) => item.id === entry.id)
    const seen = [...known, ...(previous?.conflicts ?? [])]
    const next = before.some((item) => item.id === entry.id)
      ? before.map((item) => (item.id === entry.id ? entry : item))
      : [...before, entry]
    client.setQueryData<ListEntry[]>(KEYS.list, next)
    for (const conflict of newConflicts(seen, entry.conflicts ?? []))
      toast.warning(t("list.conflicts.toast", { text: conflictText(conflict, next) }))
    void client.invalidateQueries({ queryKey: KEYS.list })
  }
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

/** AI-written questions worth asking about one university (`GET /uni-chats/{id}/suggestions`). */
export function useUniSuggestions(id: string) {
  const locale = useLocale()
  return useQuery({
    queryKey: ["admission", "uni-suggestions", id, locale] as const,
    queryFn: ({ signal }) => getUniSuggestions(id, locale, signal),
    staleTime: 10 * 60_000,
  })
}
