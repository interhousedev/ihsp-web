"use client"

import { postTelegramLogin, type TelegramLoginBody } from "@ihsp/api"
import { useMutation } from "@tanstack/react-query"

export type TelegramCredentials = Omit<TelegramLoginBody, "init_data">

type Handlers = {
  onLinked: (login: string) => void
  /** The password was right but a code is needed (Administration). */
  onSecondFactor?: (credentials: TelegramCredentials) => void
}

/** `POST /v1/id/telegram/login` for the verified `initData`: links this Telegram account on success (ID-19). */
export function useTelegramLogin(initData: string, handlers: Handlers) {
  return useMutation({
    mutationFn: (credentials: TelegramCredentials) => postTelegramLogin({ init_data: initData, ...credentials }),
    onSuccess: (result, credentials) => {
      if ("linked" in result) handlers.onLinked(result.login)
      else if (result.second_factor) handlers.onSecondFactor?.(credentials)
    },
  })
}
