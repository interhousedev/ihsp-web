"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { useSession } from "@ihsp/auth"
import { AnimatedPresence, Reveal, Skeleton, StateView } from "@ihsp/ui"
import { toast } from "sonner"
import { useComments, useDeleteComment, usePostComment, type CommentTarget } from "../api"
import { CommentForm } from "./comment-form"
import { AccessDenied, isForbidden } from "../../shell/components/access-denied"
import { CommentItem } from "./comment-item"

/** The comments of one object (GET/POST/DELETE /comments) and a form to add one. */
export function CommentsPanel({ target }: { target: CommentTarget }) {
  const t = useT("comments")
  const { session } = useSession()
  const isOwner = session?.user.id === target.studentId
  const errorMessage = useErrorMessage()
  const query = useComments(target)
  const post = usePostComment(target)
  const remove = useDeleteComment()
  const fail = (error: unknown) => toast.error(errorMessage(error))

  return (
    <section className="flex flex-col gap-4" aria-label={t("title")}>
      <CommentForm
        canHide={!isOwner}
        pending={post.isPending}
        onSubmit={(input) => post.mutateAsync(input).catch(fail)}
      />
      {query.isPending ? (
        <Skeleton className="h-20 w-full" />
      ) : query.isError && isForbidden(query.error) ? (
        <AccessDenied section="comments" />
      ) : query.isError ? (
        <StateView state="error" title={t("loadError")} onRetry={() => void query.refetch()} />
      ) : query.data.items.length === 0 ? (
        <StateView state="empty" title={t("emptyTitle")} description={t("emptyText")} />
      ) : (
        <div role="list" className="flex flex-col gap-2">
          <AnimatedPresence>
            {query.data.items.map((comment) => (
              <Reveal key={comment.id} role="listitem">
                <CommentItem comment={comment} onDelete={(id) => remove.mutate(id, { onError: fail })} />
              </Reveal>
            ))}
          </AnimatedPresence>
        </div>
      )}
    </section>
  )
}
