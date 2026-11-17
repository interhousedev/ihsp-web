import {
  getApiClient,
  type AdmissionKbArticle,
  type AdmissionKbArticleIn,
  type AdmissionKbArticleList,
  type AdmissionKbArticlePatch,
} from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const BASE = "/v1/admission/kb/articles"

export type { AdmissionKbArticle as KbArticle }

export interface KbFilter {
  q?: string
  locale?: string
  tag?: string
  status?: "draft" | "published"
}

export const kbKey = ["admission", "kb"] as const

export function useKbArticles(filter: KbFilter) {
  return useQuery({
    queryKey: [...kbKey, "list", filter],
    queryFn: ({ signal }) =>
      getApiClient().get<AdmissionKbArticleList>(BASE, {
        query: {
          q: filter.q || undefined,
          locale: filter.locale || undefined,
          tag: filter.tag || undefined,
          status: filter.status,
        },
        signal,
      }),
  })
}

export function useKbArticle(id: string | null) {
  return useQuery({
    queryKey: [...kbKey, "article", id],
    queryFn: ({ signal }) =>
      getApiClient().get<AdmissionKbArticle>(`${BASE}/${encodeURIComponent(id ?? "")}`, { signal }),
    enabled: Boolean(id),
  })
}

function useInvalidateKb() {
  const client = useQueryClient()
  return () => client.invalidateQueries({ queryKey: kbKey })
}

export function useCreateKbArticle() {
  const invalidate = useInvalidateKb()
  return useMutation({
    mutationFn: (body: AdmissionKbArticleIn) => getApiClient().post<AdmissionKbArticle>(BASE, body),
    onSuccess: invalidate,
  })
}

export function useUpdateKbArticle() {
  const invalidate = useInvalidateKb()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: AdmissionKbArticlePatch }) =>
      getApiClient().patch<AdmissionKbArticle>(`${BASE}/${encodeURIComponent(id)}`, patch),
    onSuccess: invalidate,
  })
}

export function useDeleteKbArticle() {
  const invalidate = useInvalidateKb()
  return useMutation({
    mutationFn: (id: string) => getApiClient().delete<void>(`${BASE}/${encodeURIComponent(id)}`),
    onSuccess: invalidate,
  })
}
