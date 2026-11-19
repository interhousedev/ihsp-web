"use client"

import { getApiClient, seg } from "@ihsp/api"
import { getConfig } from "@ihsp/config"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

/** Mirrors the backend `InviteIn.audience` literal. */
export const INVITE_AUDIENCES = ["classmate", "parent", "counselor"] as const
export type InviteAudience = (typeof INVITE_AUDIENCES)[number]

/** Mirrors `InviteOut`; `comment_count` is read when the server sends it. */
export type EssayInvite = {
  id: string
  audience: InviteAudience | "other"
  can_comment: boolean
  label: string | null
  active: boolean
  expires_at: string
  created_at: string | null
  last_opened_at: string | null
  revoked_at: string | null
  comment_count?: number
}
/** Mirrors `InviteCreatedOut`: the only response that carries the raw token. */
export type EssayInviteCreated = EssayInvite & { token: string }
export type EssayInviteIn = { audience: InviteAudience; can_comment: boolean; ttl_days: number }

export const TTL_MIN = 1
export const TTL_MAX = 90
export const TTL_DEFAULT = 30

const keys = { list: (essayId: string) => ["admission", "essay-invites", essayId] as const }
const base = (essayId: string) => `/v1/admission/essays/${seg(essayId)}/invites`

/** The review link: the token lives in the fragment, so no server or log ever sees it. */
export function reviewUrl(token: string): string {
  return `${getConfig().SHARE_URL.replace(/\/+$/, "")}/essay-review/#${token}`
}

export function useEssayInvites(essayId: string, enabled: boolean) {
  return useQuery({
    queryKey: keys.list(essayId),
    enabled,
    queryFn: ({ signal }) => getApiClient().get<{ items: EssayInvite[] }>(base(essayId), { signal }),
  })
}

export function useCreateInvite(essayId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (body: EssayInviteIn) => getApiClient().post<EssayInviteCreated>(base(essayId), body),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.list(essayId) }),
  })
}

export function useRevokeInvite(essayId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (inviteId: string) => getApiClient().delete<void>(`${base(essayId)}/${seg(inviteId)}`),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.list(essayId) }),
  })
}
