"use client"

import { getStaffExcuses, keys, type Excuse, type ExcuseStatus } from "@ihsp/api"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useMemo } from "react"

/** `GET /v1/staff/excuses?status=`: the pages loaded so far, shaped for `QueryState`. */
export function useExcusesList(status: ExcuseStatus) {
  const query = useInfiniteQuery({
    queryKey: [...keys.staff.excuses({ status }), "pages"],
    queryFn: ({ pageParam, signal }) => getStaffExcuses({ status, cursor: pageParam }, { signal }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  })
  const items = useMemo<Excuse[] | undefined>(() => query.data?.pages.flatMap((page) => page.items), [query.data])
  return {
    data: items,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: () => void query.refetch(),
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: () => void query.fetchNextPage(),
  }
}
