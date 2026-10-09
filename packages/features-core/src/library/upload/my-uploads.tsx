"use client"

import { deleteMaterial, getMyUploads, keys, type ItemStatus, type UploadRow } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, ConfirmDialog, Icons, Skeleton, StateView, buttonVariants } from "@ihsp/ui"
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { uploadHref } from "../utils/hrefs"
import { UploadRowCard } from "./upload-row-card"

/** The filter: every status of an upload, in the order of its life. */
export const UPLOAD_STATUS_FILTERS: readonly ItemStatus[] = [
  "draft",
  "pending_review",
  "changes_requested",
  "published",
  "held",
  "rejected",
  "unpublished",
]

/**
 * "My uploads" (a tab of My library): the user's materials with a status chip, the reviewer's reason and message, the
 * place in the queue, and **Edit**, **Resubmit** and **Withdraw**. Filter by status; "Load more" pages through them.
 */
export function MyUploads() {
  const t = useT("library.myUploads")
  const item = useT("library.item")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<ItemStatus | null>(null)
  const [target, setTarget] = useState<UploadRow | null>(null)
  const params = status ? { status } : undefined

  const query = useInfiniteQuery({
    queryKey: [...keys.library.uploads(params), "pages"],
    queryFn: ({ pageParam, signal }) =>
      getMyUploads({ ...params, ...(pageParam ? { cursor: pageParam } : {}) }, { signal }),
    initialPageParam: "",
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  })
  const rows = query.data?.pages.flatMap((page) => page.items) ?? []

  const withdraw = useMutation({
    mutationFn: (row: UploadRow) => deleteMaterial(row.item.id!),
    onSuccess: (_result, row) => {
      toast.success(row.status === "draft" ? t("deleted") : item("withdrawn"))
      setTarget(null)
      void queryClient.invalidateQueries({ queryKey: keys.library.all() })
    },
  })
  const draft = target?.status === "draft"

  return (
    <section aria-label={t("label")} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label={t("filter")} className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={status === null ? "default" : "outline"}
            aria-pressed={status === null}
            className="min-h-11 rounded-full px-4 md:min-h-8"
            onClick={() => setStatus(null)}
          >
            {t("all")}
          </Button>
          {UPLOAD_STATUS_FILTERS.map((value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={status === value ? "default" : "outline"}
              aria-pressed={status === value}
              className="min-h-11 rounded-full px-4 md:min-h-8"
              onClick={() => setStatus(value)}
            >
              {item(`status.${value}`)}
            </Button>
          ))}
        </div>
        <Link href={uploadHref()} className={buttonVariants({ className: "min-h-11 md:min-h-8" })}>
          <Icons.add aria-hidden />
          {t("add")}
        </Link>
      </div>

      {query.isPending ? (
        <div role="status" aria-busy="true" className="flex flex-col gap-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : query.isError ? (
        <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
      ) : rows.length === 0 ? (
        <StateView
          state="empty"
          emptyText={status ? t("emptyFiltered") : t("empty")}
          action={
            status ? (
              <Button type="button" variant="outline" className="min-h-11" onClick={() => setStatus(null)}>
                {t("showAll")}
              </Button>
            ) : (
              <Link href={uploadHref()} className={buttonVariants({ className: "min-h-11" })}>
                {t("add")}
              </Link>
            )
          }
        />
      ) : (
        <>
          <ul className="flex flex-col gap-3" aria-label={t("list")}>
            {rows.map((row) => (
              <li key={row.item.id ?? row.item.title}>
                <UploadRowCard row={row} onWithdraw={setTarget} />
              </li>
            ))}
          </ul>
          {query.hasNextPage ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-11 self-center"
              disabled={query.isFetchingNextPage}
              onClick={() => void query.fetchNextPage()}
            >
              {query.isFetchingNextPage ? t("loadingMore") : t("loadMore")}
            </Button>
          ) : null}
        </>
      )}

      <ConfirmDialog
        open={target !== null}
        onOpenChange={(open) => {
          if (!open) {
            setTarget(null)
            withdraw.reset()
          }
        }}
        title={draft ? t("deleteDraftTitle") : item("withdrawConfirmTitle")}
        description={draft ? t("deleteDraftText") : item("withdrawConfirmText")}
        confirmLabel={draft ? t("deleteDraft") : item("withdraw")}
        destructive
        loading={withdraw.isPending}
        onConfirm={() => {
          if (target) withdraw.mutate(target)
        }}
      >
        {withdraw.isError ? (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage(withdraw.error)}
          </p>
        ) : null}
      </ConfirmDialog>
    </section>
  )
}
