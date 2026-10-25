"use client"

import { getConfig } from "@ihsp/config"
import { useT } from "@ihsp/i18n"
import { isMiniApp } from "@ihsp/telegram/core"
import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Icons,
  buttonVariants,
} from "@ihsp/ui"
import type { ReactNode } from "react"
import { FullScreenSpinner } from "./full-screen-spinner"
import { retryBootstrap } from "./session"
import { useSession } from "./use-session"

function NotLinked() {
  const t = useT()
  const bot = getConfig().BOT_USERNAME
  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Icons.send aria-hidden />
          </EmptyMedia>
          <EmptyTitle>{t("auth.telegramTitle")}</EmptyTitle>
          <EmptyDescription>{t("auth.telegramDescription")}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <a href={`https://t.me/${bot}`} className={buttonVariants({ className: "min-h-11" })}>
            {t("auth.telegramOpenBot", { bot })}
          </a>
          <Button variant="outline" className="min-h-11" onClick={() => void retryBootstrap()}>
            {t("common.retry")}
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}

/**
 * Inside a Telegram mini app the session comes from `initData` (`POST /v1/oauth/telegram`), not from a redirect.
 * While it is being exchanged a spinner shows; a rejected `initData` (account not linked) shows "Log in in the bot".
 * Outside Telegram it renders `children` unchanged, so `RequireAuth` inside them does the normal login.
 */
export function TelegramAutoLogin({ children }: { children: ReactNode }) {
  const t = useT()
  const { status } = useSession()
  if (!isMiniApp()) return <>{children}</>
  if (status === "authenticated") return <>{children}</>
  if (status === "anonymous") return <NotLinked />
  return <FullScreenSpinner text={t("auth.telegramLoading")} />
}
