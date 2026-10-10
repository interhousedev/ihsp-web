"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import type { ReactNode } from "react"
import { cn } from "../lib/utils"
import { Icons } from "./icons"
import { Button } from "./ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "./ui/empty"
import { Skeleton } from "./ui/skeleton"

export type StateViewProps = {
  state: "loading" | "empty" | "error" | "offline"
  /** Shows the "Try again" button (error and offline). */
  onRetry?: () => void
  /** Text for `empty`; defaults to the shared "Nothing here yet". */
  emptyText?: string
  /** For `error`: the failed request's error; its API `type` picks the message (`errors.<type>`). */
  error?: unknown
  /** Icon for `empty` (e.g. `<Icons.files aria-hidden />`); defaults to the registry's inbox. */
  icon?: ReactNode
  /** Optional call to action under an empty state. */
  action?: ReactNode
  /** Skeleton rows shown for `loading` (default 3). */
  rows?: number
  className?: string
}

function LoadingState({ rows, className }: { rows: number; className?: string }) {
  const t = useT()
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={t("state.loadingTitle")}
      className={cn("flex flex-col gap-3", className)}
    >
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-16 w-full rounded-lg" />
      ))}
    </div>
  )
}

/** The four non-content states of every page: loading skeleton, empty, error with retry, offline. */
export function StateView({ state, onRetry, emptyText, error, action, icon, rows = 3, className }: StateViewProps) {
  const t = useT()
  const errorMessage = useErrorMessage()

  if (state === "loading") return <LoadingState rows={rows} className={className} />

  const view = {
    empty: {
      icon: icon ?? <Icons.inbox aria-hidden />,
      title: emptyText ?? t("state.emptyTitle"),
      description: emptyText ? undefined : t("state.emptyDescription"),
    },
    error: {
      icon: <Icons.alertCircle aria-hidden />,
      title: t("state.errorTitle"),
      description: error === undefined ? t("state.errorDescription") : errorMessage(error),
    },
    offline: {
      icon: <Icons.offline aria-hidden />,
      title: t("state.offlineTitle"),
      description: t("state.offlineDescription"),
    },
  }[state]

  return (
    <Empty className={cn("border", className)} role={state === "error" ? "alert" : "status"}>
      <EmptyHeader>
        <EmptyMedia variant="icon">{view.icon}</EmptyMedia>
        <EmptyTitle>{view.title}</EmptyTitle>
        {view.description ? <EmptyDescription>{view.description}</EmptyDescription> : null}
      </EmptyHeader>
      {onRetry && state !== "empty" ? (
        <EmptyContent>
          <Button variant="outline" onClick={onRetry} className="min-h-11 md:min-h-8">
            {t("common.retry")}
          </Button>
        </EmptyContent>
      ) : null}
      {action && state === "empty" ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  )
}
