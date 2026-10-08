import { QueryClient } from "@tanstack/react-query"

/** Client errors (4xx) will not change on a retry; network and 5xx errors get two more attempts. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  const status = typeof error === "object" && error !== null ? (error as { status?: unknown }).status : undefined
  if (typeof status === "number" && status >= 400 && status < 500) return false
  return failureCount < 2
}

/** One `QueryClient` per app (create it in a module-level constant or `useState`, never per render). */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: shouldRetry,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  })
}
