"use client"

import { useSession } from "@ihsp/auth"
import { formatDateTime, useT } from "@ihsp/i18n"
import { Button, Icons, Pill } from "@ihsp/ui"
import type { Comment } from "../api"

/** One comment with its visibility chip; the author may delete it. */
export function CommentItem({ comment, onDelete }: { comment: Comment; onDelete?: (id: string) => void }) {
  const t = useT("comments")
  const { session } = useSession()
  const mine = session?.user.id === comment.author_id
  const staffOnly = comment.visibility === "staff_only"
  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Pill tone={staffOnly ? "warning" : "success"} data-testid="comment-visibility">
            {staffOnly ? t("staffOnly") : t("visibleToStudent")}
          </Pill>
          <span className="text-muted-foreground text-xs">{formatDateTime(comment.created_at)}</span>
        </div>
        {mine && onDelete ? (
          <Button variant="ghost" size="icon" aria-label={t("delete")} onClick={() => onDelete(comment.id)}>
            <Icons.trash className="size-4" />
          </Button>
        ) : null}
      </div>
      <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
    </div>
  )
}
