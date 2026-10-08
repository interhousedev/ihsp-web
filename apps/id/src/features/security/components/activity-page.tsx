"use client"

import { getIdMeActivity, keys } from "@ihsp/api"
import { PageContainer, StateView, LoadingButton } from "@ihsp/ui"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useTr } from "../../shared/hooks/use-tr"
import { useLoadMore } from "../hooks/use-load-more"
import { ActivityHelp } from "./activity-help"
import { ActivityRow } from "./activity-row"

/** `/security/activity/` (UF-ID-14, GEN-6): the user's security events, loaded as they scroll. */
export function ActivityPage() {
  const t = useTr()
  const query = useInfiniteQuery({
    queryKey: keys.id.activity(),
    queryFn: ({ pageParam, signal }) => getIdMeActivity(pageParam ? { cursor: pageParam } : undefined, { signal }),
    initialPageParam: "",
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  })
  const sentinel = useLoadMore(
    () => void query.fetchNextPage(),
    Boolean(query.hasNextPage) && !query.isFetchingNextPage,
  )
  const items = query.data?.pages.flatMap((page) => page.items) ?? []

  return (
    <PageContainer title={t("security.activity.title")} description={t("security.activity.description")}>
      <ActivityHelp />
      {query.isPending ? <StateView state="loading" /> : null}
      {query.isError ? <StateView state="error" error={query.error} onRetry={() => void query.refetch()} /> : null}
      {query.isSuccess && items.length === 0 ? (
        <StateView state="empty" emptyText={t("security.activity.empty")} />
      ) : null}
      <ul className="grid gap-3">
        {items.map((item) => (
          <li key={item.id}>
            <ActivityRow item={item} />
          </li>
        ))}
      </ul>
      {query.hasNextPage ? (
        <div ref={sentinel} className="flex justify-center">
          <LoadingButton
            type="button"
            variant="outline"
            className="h-11"
            loading={query.isFetchingNextPage}
            loadingLabel={t("idCommon.working")}
            onClick={() => void query.fetchNextPage()}
          >
            {t("security.activity.more")}
          </LoadingButton>
        </div>
      ) : null}
    </PageContainer>
  )
}
