"use client"

import { useT } from "@ihsp/i18n"
import { Skeleton, StateView } from "@ihsp/ui"
import Link from "next/link"
import { useCommentInbox } from "../api"
import { CommentItem } from "./comment-item"

/** Comments others left for the caller; each links to the student's comments tab. */
export function CommentsInbox() {
  const t = useT("comments")
  const query = useCommentInbox()
  if (query.isPending) return <Skeleton className="h-24 w-full" />
  if (query.isError) return <StateView state="error" title={t("loadError")} onRetry={() => void query.refetch()} />
  if (query.data.items.length === 0)
    return <StateView state="empty" title={t("inboxEmptyTitle")} description={t("inboxEmptyText")} />
  return (
    <div role="list" className="flex flex-col gap-2">
      {query.data.items.map((comment) => (
        <div key={comment.id} role="listitem" className="flex flex-col gap-1">
          <CommentItem comment={comment} />
          <Link
            className="text-primary self-end text-sm underline-offset-2 hover:underline"
            href={`/staff/students/view/?id=${comment.student_id}&tab=comments`}
          >
            {t("openStudent")}
          </Link>
        </div>
      ))}
    </div>
  )
}
