"use client"

import { getApiClient } from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

/** `staff_only` comments are never shown to the student or a mentor. */
export type CommentVisibility = "student_and_staff" | "staff_only"

export type Comment = {
  id: string
  student_id: string
  target_kind: string
  target_id: string
  author_id: string
  body: string
  visibility: CommentVisibility
  created_at: string
  anchor: Record<string, unknown> | null
}

export type CommentTarget = { studentId: string; kind: string; id: string }

export type NewComment = { body: string; visibility: CommentVisibility }

export const commentKeys = {
  all: ["admission", "comments"] as const,
  list: (target: CommentTarget) => ["admission", "comments", "list", target.studentId, target.kind, target.id] as const,
  inbox: ["admission", "comments", "inbox"] as const,
}

/** GET /v1/admission/comments — comments on one object the caller may see. */
export function fetchComments(target: CommentTarget): Promise<{ items: Comment[] }> {
  return getApiClient().get("/v1/admission/comments", {
    query: { student_id: target.studentId, target_kind: target.kind, target_id: target.id },
  })
}

/** GET /v1/admission/comments/inbox — comments others left for the caller. */
export function fetchCommentInbox(): Promise<{ items: Comment[] }> {
  return getApiClient().get("/v1/admission/comments/inbox")
}

export function useComments(target: CommentTarget) {
  return useQuery({ queryKey: commentKeys.list(target), queryFn: () => fetchComments(target) })
}

export function useCommentInbox() {
  return useQuery({ queryKey: commentKeys.inbox, queryFn: fetchCommentInbox })
}

/** POST /v1/admission/comments. */
export function usePostComment(target: CommentTarget) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: NewComment) =>
      getApiClient().post<Comment>("/v1/admission/comments", {
        student_id: target.studentId,
        target_kind: target.kind,
        target_id: target.id,
        body: input.body,
        visibility: input.visibility,
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: commentKeys.all }),
  })
}

/** DELETE /v1/admission/comments/{id}. */
export function useDeleteComment() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => getApiClient().delete<void>(`/v1/admission/comments/${id}`),
    onSuccess: () => client.invalidateQueries({ queryKey: commentKeys.all }),
  })
}
