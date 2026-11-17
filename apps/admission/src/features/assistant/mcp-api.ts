import { api, getIdPersonalTokensQuery, type NoContent } from "@ihsp/api"
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export type McpScope = "admission:read" | "admission:memory" | "admission:docs" | "admission:documents"

export type McpConnection = {
  url: string
  scopes: McpScope[]
  max_expiry_days: number
  example_config: Record<string, unknown>
}

export type MemoryNote = {
  id: string
  content: string
  source: "app" | "mcp" | "assistant"
  created_at: string
}

const connectionKey = ["admission", "mcp", "connection"] as const
const notesKey = ["admission", "memory-notes"] as const

export const mcpConnectionQuery = () =>
  queryOptions({
    queryKey: connectionKey,
    queryFn: ({ signal }) => api.get<McpConnection>("/v1/admission/mcp/connection", { signal }),
  })

export const memoryNotesQuery = () =>
  queryOptions({
    queryKey: notesKey,
    queryFn: ({ signal }) => api.get<{ items: MemoryNote[] }>("/v1/admission/memory-notes", { signal }),
  })

export function useMcpConnection() {
  return useQuery(mcpConnectionQuery())
}

export function useMemoryNotes() {
  return useQuery(memoryNotesQuery())
}

export function useAddMemoryNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (content: string) => api.post<MemoryNote>("/v1/admission/memory-notes", { content }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notesKey }),
  })
}

export function useDeleteMemoryNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete<NoContent>(`/v1/admission/memory-notes/${encodeURIComponent(id)}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notesKey }),
  })
}

/** The personal tokens of the account that carry an admission scope. */
export function useAdmissionTokens() {
  return useQuery({
    ...getIdPersonalTokensQuery(),
    select: (tokens) =>
      tokens.filter(
        (token) => token.revoked_at === null && token.scopes.some((scope) => scope.startsWith("admission:")),
      ),
  })
}
