"use client"

import {
  keys,
  postMeExcuse,
  postMeExcuseCancel,
  postMeExcuseMessage,
  type Excuse,
  type ExcuseMessageBody,
  type ExcuseRequestBody,
} from "@ihsp/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"

/** Excuses change what the timetable and attendance show, so those lists refresh with them. */
function useRefresh() {
  const queryClient = useQueryClient()
  return (excuse: Excuse) => {
    queryClient.setQueryData(keys.me.excuse(excuse.id), excuse)
    void queryClient.invalidateQueries({ queryKey: ["me", "excuses", "list"] })
    void queryClient.invalidateQueries({ queryKey: ["me", "attendance"] })
  }
}

export function useCreateExcuse() {
  const refresh = useRefresh()
  return useMutation({ mutationFn: (body: ExcuseRequestBody) => postMeExcuse(body), onSuccess: refresh })
}

export function useCancelExcuse(id: string) {
  const refresh = useRefresh()
  return useMutation({ mutationFn: () => postMeExcuseCancel(id), onSuccess: refresh })
}

export function usePostExcuseMessage(id: string) {
  const refresh = useRefresh()
  return useMutation({ mutationFn: (body: ExcuseMessageBody) => postMeExcuseMessage(id, body), onSuccess: refresh })
}
