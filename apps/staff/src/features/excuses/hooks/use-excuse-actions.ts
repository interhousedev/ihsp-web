"use client"

import {
  patchStaffExcuse,
  postStaffExcuse,
  postStaffExcuseApprove,
  postStaffExcuseMessage,
  postStaffExcuseReject,
  postStaffExcuseRevoke,
  type Excuse,
  type ExcuseExclusionBody,
  type ExcuseMessageBody,
} from "@ihsp/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"

export type ExcuseDecision = "approve" | "reject" | "revoke"

const DECIDE = {
  approve: postStaffExcuseApprove,
  reject: postStaffExcuseReject,
  revoke: postStaffExcuseRevoke,
} as const

/** The staff mutations of one excuse; each refreshes the lists, the detail and the journals (an excuse locks absences). */
export function useExcuseActions(id: string) {
  const queryClient = useQueryClient()
  const refresh = (excuse: Excuse) => {
    queryClient.setQueryData(["staff", "excuses", "detail", id], excuse)
    void queryClient.invalidateQueries({ queryKey: ["staff", "excuses"] })
    void queryClient.invalidateQueries({ queryKey: ["staff", "journal"] })
  }
  const decide = useMutation({
    mutationFn: ({ kind, comment }: { kind: ExcuseDecision; comment: string }) =>
      DECIDE[kind](id, comment ? { comment } : {}),
    onSuccess: refresh,
  })
  const end = useMutation({
    mutationFn: (endsOn: string) => patchStaffExcuse(id, { ends_on: endsOn }),
    onSuccess: refresh,
  })
  const message = useMutation({
    mutationFn: (body: ExcuseMessageBody) => postStaffExcuseMessage(id, body),
    onSuccess: refresh,
  })
  return { decide, end, message }
}

/** `POST /v1/staff/excuses`, then the documents as the first message (the create body has no files). */
export function useCreateExclusion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ body, fileIds }: { body: ExcuseExclusionBody; fileIds: string[] }) => {
      const created = await postStaffExcuse(body)
      return fileIds.length > 0 ? postStaffExcuseMessage(created.id, { file_ids: fileIds }) : created
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["staff", "excuses"] })
      void queryClient.invalidateQueries({ queryKey: ["staff", "journal"] })
    },
  })
}
