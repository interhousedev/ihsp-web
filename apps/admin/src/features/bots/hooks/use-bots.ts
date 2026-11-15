"use client"

import {
  getAdminBotsQuery,
  getAdminBroadcastsQuery,
  keys,
  patchAdminBot,
  postAdminBot,
  postAdminBotAnnouncement,
  postAdminBotRotateToken,
  type BotAnnouncementCreate,
  type BotCreate,
  type BotPatch,
} from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useQuery } from "@tanstack/react-query"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"

const BOTS_KEY = keys.admin.bots.all()

export function useBots() {
  return useQuery(getAdminBotsQuery())
}

/** Draft broadcasts that can be announced through the selected bots. */
export function useDraftBroadcasts() {
  return useQuery(getAdminBroadcastsQuery({ status: "draft" }))
}

export function useAddBot(onSuccess?: () => void) {
  const t = useT("bots")
  return useAdminMutation({
    mutationFn: (input: BotCreate) => postAdminBot(input),
    invalidate: [BOTS_KEY],
    inlineError: true,
    success: t("added"),
    onSuccess: () => onSuccess?.(),
  })
}

export function useUpdateBot(onSuccess?: () => void) {
  const t = useT("bots")
  return useAdminMutation({
    mutationFn: ({ id, body }: { id: string; body: BotPatch }) => patchAdminBot(id, body),
    invalidate: [BOTS_KEY],
    success: t("saved"),
    onSuccess: () => onSuccess?.(),
  })
}

export function useRotateBotToken(onSuccess?: () => void) {
  const t = useT("bots")
  return useAdminMutation({
    mutationFn: ({ id, token, otp_code }: { id: string; token: string; otp_code: string }) =>
      postAdminBotRotateToken(id, { token, otp_code }),
    invalidate: [BOTS_KEY],
    success: t("rotated"),
    onSuccess: () => onSuccess?.(),
  })
}

export function useAnnounce(onSuccess?: () => void) {
  const t = useT("bots")
  return useAdminMutation({
    mutationFn: (input: BotAnnouncementCreate) => postAdminBotAnnouncement(input),
    invalidate: [BOTS_KEY, keys.admin.broadcasts.all()],
    success: (data) => t("announce.sent", { count: data.recipients }),
    onSuccess: () => onSuccess?.(),
  })
}
