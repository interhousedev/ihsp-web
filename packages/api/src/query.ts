/**
 * Minimal, dependency-free stand-in for TanStack Query's `queryOptions`:
 * a `{ queryKey, queryFn }` object that `useQuery`, `useSuspenseQuery` and `queryClient.fetchQuery` accept as is.
 */
export type QueryDefinition<T> = {
  queryKey: readonly unknown[]
  queryFn: (context: { signal?: AbortSignal }) => Promise<T>
}

export function queryOptions<T>(definition: QueryDefinition<T>): QueryDefinition<T> {
  return definition
}

/** Options accepted by every endpoint function as its last argument. */
export type RequestOptions = { signal?: AbortSignal; cache?: RequestCache }

/** Encodes one path segment (slugs, tokens and ids are user-controlled strings). */
export function seg(value: string | number): string {
  return encodeURIComponent(String(value))
}
