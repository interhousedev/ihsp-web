"use client"

import {
  postAdminExcuseApprove,
  postAdminExcuseMessage,
  postAdminExcuseReject,
  type Excuse,
  type ExcuseMessageBody,
} from "@ihsp/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"

export type ExcuseDecision = "approve" | "reject"

const DECIDE = { approve: postAdminExcuseApprove, reject: postAdminExcuseReject } as const

/** The admin mutations of one excuse; each refreshes the lists and the detail. */
export function useExcuseActions(id: string) {
  const queryClient = useQueryClient()
  const refresh = (excuse: Excuse) => {
    queryClient.setQueryData(["admin", "excuses", "detail", id], excuse)
    void queryClient.invalidateQueries({ queryKey: ["admin", "excuses"] })
  }
  const decide = useMutation({
    mutationFn: ({ kind, comment }: { kind: ExcuseDecision; comment: string }) =>
      DECIDE[kind](id, comment ? { comment } : {}),
    onSuccess: refresh,
  })
  const message = useMutation({
    mutationFn: (body: ExcuseMessageBody) => postAdminExcuseMessage(id, body),
    onSuccess: refresh,
  })
  return { decide, message }
}
