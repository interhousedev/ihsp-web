"use client"

import {
  isApiError,
  keys,
  postModeration,
  postReportResolve,
  type ManageQueueRow,
  type ModerationAction,
  type Page,
  type QueueTab,
  type ReportResolveAction,
} from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { queueQuery, rowKey } from "./queue-utils"

const titleOf = (row: ManageQueueRow) => row.suggestion?.title ?? row.item.title

/** The result of the last action, for the live region of the page. */
export type QueueStatus = { tone: "ok" | "error"; text: string }

type Job = {
  row: ManageQueueRow
  /** The announcement for success, already translated. */
  announce: string
  run: () => Promise<unknown>
}

type Callbacks = { onSuccess?: () => void; onError?: (error: unknown) => void }

const STATUS_MS = 10_000

/**
 * The write side of the queue. Every action removes the row from the tab at once (optimistic), puts it back when the
 * API refuses, and announces the result. `403 library/own-item` marks the row "Needs another librarian" instead of
 * showing a generic error. After the request settles, everything under `library` is refetched, so the counts of the
 * other tabs and the catalogue follow.
 */
export function useQueueActions(tab: QueueTab) {
  const t = useT("library.manage.queue.announce")
  const manage = useT("library.manage")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const key = queueQuery(tab).queryKey
  const [status, setStatus] = useState<QueueStatus | null>(null)
  const [blocked, setBlocked] = useState<ReadonlySet<string>>(new Set())

  useEffect(() => {
    if (!status) return
    const timer = setTimeout(() => setStatus(null), STATUS_MS)
    return () => clearTimeout(timer)
  }, [status])

  const mutation = useMutation({
    mutationFn: (job: Job) => job.run(),
    onMutate: async (job) => {
      // The tab can change while the request runs: remember which cache entry was edited.
      const queryKey = key
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<Page<ManageQueueRow>>(queryKey)
      queryClient.setQueryData<Page<ManageQueueRow>>(queryKey, (page) =>
        page ? { ...page, items: page.items.filter((row) => rowKey(row) !== rowKey(job.row)) } : page,
      )
      return { previous, queryKey }
    },
    onError: (error, job, context) => {
      if (context?.previous) queryClient.setQueryData(context.queryKey, context.previous)
      if (isApiError(error) && error.type === "library/own-item") {
        setBlocked((current) => new Set(current).add(rowKey(job.row)))
        setStatus({ tone: "error", text: manage("ownItem") })
      } else {
        setStatus({ tone: "error", text: errorMessage(error) })
      }
    },
    onSuccess: (_result, job) => setStatus({ tone: "ok", text: job.announce }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.library.all() }),
  })

  function moderate(row: ManageQueueRow, action: ModerationAction, reason: string | undefined, callbacks?: Callbacks) {
    const id = row.item.id
    if (!id) return
    mutation.mutate(
      {
        row,
        announce: t(action, { title: titleOf(row) }),
        run: () => postModeration(id, action, reason ? { reason } : undefined),
      },
      callbacks,
    )
  }

  function resolve(row: ManageQueueRow, action: ReportResolveAction, callbacks?: Callbacks) {
    const ids = row.report_ids ?? []
    mutation.mutate(
      {
        row,
        announce: t("resolve", { title: titleOf(row) }),
        run: () => Promise.all(ids.map((id) => postReportResolve(id, { action }))),
      },
      callbacks,
    )
  }

  return {
    moderate,
    resolve,
    pending: mutation.isPending,
    error: mutation.error,
    resetError: mutation.reset,
    status,
    clearStatus: () => setStatus(null),
    blocked,
  }
}
