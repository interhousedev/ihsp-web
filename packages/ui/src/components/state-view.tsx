"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import type { ComponentProps, ReactNode } from "react"
import { cn } from "../lib/utils"
import { Icons } from "./icons"
import { Button } from "./ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "./ui/empty"
import { Skeleton } from "./ui/skeleton"

export type StateViewProps = Omit<ComponentProps<"div">, "children" | "title"> & {
  /** `filtered`: data exists but the search or filters hide all of it; pass `onReset`. */
  state: "loading" | "empty" | "filtered" | "error" | "offline"
  /** Shows the "Try again" button (error and offline). */
  onRetry?: () => void
  /** Shows the "Reset filters" button (filtered). */
  onReset?: () => void
  /** Text for `empty` and `filtered`; replaces the shared title and its description. */
  emptyText?: string
  /** Replaces the state's own title (for states that are not really "empty": no access, sent, blocked). */
  title?: string
  /** Replaces the state's own description. */
  description?: ReactNode
  /** For `error`: the failed request's error; its API `type` picks the message (`errors.<type>`). */
  error?: unknown
  /** Icon for any state but `loading` (e.g. `<Icons.files aria-hidden />`); each state has a default. */
  icon?: ReactNode
  /** Links or buttons under the text; several wrap in a row. */
  action?: ReactNode
  /** Skeleton rows shown for `loading` (default 3). */
  rows?: number
  /** For `loading`: a skeleton shaped like the content, shown instead of the rows. */
  skeleton?: ReactNode
}

const ACTION_CLASS = "min-h-11 md:min-h-8"

function LoadingState({ rows, skeleton, className }: { rows: number; skeleton?: ReactNode; className?: string }) {
  const t = useT()
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={t("state.loadingTitle")}
      className={cn("flex flex-col gap-3", className)}
    >
      {skeleton ??
        Array.from({ length: rows }, (_, index) => <Skeleton key={index} className="h-16 w-full rounded-lg" />)}
    </div>
  )
}

/** The non-content states of every page: loading skeleton, empty, filtered to nothing, error with retry, offline. */
export function StateView({
  state,
  onRetry,
  onReset,
  emptyText,
  title,
  description,
  error,
  action,
  icon,
  rows = 3,
  skeleton,
  className,
  role,
  ...props
}: StateViewProps) {
  const t = useT()
  const errorMessage = useErrorMessage()

  if (state === "loading") return <LoadingState rows={rows} skeleton={skeleton} className={className} />

  const view = {
    empty: {
      icon: <Icons.inbox aria-hidden />,
      title: emptyText ?? t("state.emptyTitle"),
      description: emptyText || title ? undefined : t("state.emptyDescription"),
    },
    filtered: {
      icon: <Icons.search aria-hidden />,
      title: emptyText ?? t("state.filteredTitle"),
      description: undefined,
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
  const shownDescription = description ?? view.description
  const retry = onRetry && (state === "error" || state === "offline")
  const reset = onReset && state === "filtered"

  return (
    <Empty className={cn("border", className)} role={role ?? (state === "error" ? "alert" : "status")} {...props}>
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon ?? view.icon}</EmptyMedia>
        <EmptyTitle>{title ?? view.title}</EmptyTitle>
        {shownDescription ? <EmptyDescription>{shownDescription}</EmptyDescription> : null}
      </EmptyHeader>
      {retry || reset || action ? (
        <EmptyContent className="flex-row flex-wrap justify-center">
          {retry ? (
            <Button variant="outline" onClick={onRetry} className={ACTION_CLASS}>
              {t("common.retry")}
            </Button>
          ) : null}
          {reset ? (
            <Button variant="outline" onClick={onReset} className={ACTION_CLASS}>
              {t("state.resetFilters")}
            </Button>
          ) : null}
          {action}
        </EmptyContent>
      ) : null}
    </Empty>
  )
}
