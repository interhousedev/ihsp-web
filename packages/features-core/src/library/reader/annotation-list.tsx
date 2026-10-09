"use client"

import { useT } from "@ihsp/i18n"
import {
  Badge,
  Button,
  ConfirmDialog,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  cn,
} from "@ihsp/ui"
import { IconBookmark, IconHighlight, IconPencil, IconRefresh, IconTrash } from "@tabler/icons-react"
import { useEffect, useRef, useState } from "react"
import { byPosition } from "./lib/annotation-order"
import { COLOR_BORDER, COLOR_ICONS, COLOR_TEXT } from "./lib/colors"
import { isPageLocator } from "./lib/locator"
import { SignInLink } from "../catalog"
import type { ViewAnnotation } from "./use-reader-annotations"

export type AnnotationListProps = {
  annotations: readonly ViewAnnotation[]
  /** The annotation to scroll to and mark (a tap on a note marker in the text). */
  activeId: string | null
  /** False for visitors: the list explains why there is nothing to edit. */
  canEdit: boolean
  onOpen(annotation: ViewAnnotation): void
  onEdit(annotation: ViewAnnotation): void
  onRemove(annotation: ViewAnnotation): void
  onRetry(annotation: ViewAnnotation): void
  onDiscard(annotation: ViewAnnotation): void
}

function Place({ annotation }: { annotation: ViewAnnotation }) {
  const t = useT("library.annotation")
  const locator = annotation.locator
  return (
    <span className="text-muted-foreground text-xs tabular-nums">
      {isPageLocator(locator)
        ? t("page", { page: locator.page })
        : t("percent", { percent: Math.round(locator.progress * 100) })}
    </span>
  )
}

function KindIcon({ annotation }: { annotation: ViewAnnotation }) {
  const Icon = COLOR_ICONS[annotation.color]
  return (
    <span className="flex items-center gap-1.5">
      <Icon className={cn("size-4", COLOR_TEXT[annotation.color])} aria-hidden />
      {annotation.kind === "bookmark" ? (
        <IconBookmark className="size-4" aria-hidden />
      ) : annotation.kind === "note" ? (
        <IconPencil className="size-4" aria-hidden />
      ) : (
        <IconHighlight className="size-4" aria-hidden />
      )}
    </span>
  )
}

function SyncState({ annotation }: { annotation: ViewAnnotation }) {
  const t = useT("library.annotation")
  if (annotation.sync === "synced") return null
  return (
    <Badge variant={annotation.sync === "failed" ? "destructive" : "secondary"}>{t(`sync.${annotation.sync}`)}</Badge>
  )
}

function Card({
  annotation,
  active,
  canEdit,
  onOpen,
  onEdit,
  onAskRemove,
  onRetry,
  onDiscard,
}: {
  annotation: ViewAnnotation
  active: boolean
  canEdit: boolean
  onOpen(): void
  onEdit(): void
  onAskRemove(): void
  onRetry(): void
  onDiscard(): void
}) {
  const t = useT("library.annotation")
  const ref = useRef<HTMLLIElement>(null)
  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: "nearest" })
  }, [active])
  const unsent = annotation.sync !== "synced"
  return (
    <li
      ref={ref}
      data-annotation-id={annotation.id}
      aria-current={active ? "true" : undefined}
      className={cn("bg-card flex flex-col gap-2 rounded-lg border p-3", active && "ring-ring ring-2")}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <KindIcon annotation={annotation} />
          <span className="text-sm font-medium">{t(`kind.${annotation.kind}`)}</span>
          <Place annotation={annotation} />
        </span>
        <SyncState annotation={annotation} />
      </div>
      {annotation.quote ? (
        <blockquote className={cn("border-s-4 ps-3 text-sm", COLOR_BORDER[annotation.color])}>
          <span className="line-clamp-5 break-words">{annotation.quote}</span>
        </blockquote>
      ) : null}
      {annotation.note ? <p className="text-sm break-words whitespace-pre-wrap">{annotation.note}</p> : null}
      <div className="flex flex-wrap items-center gap-1">
        <Button type="button" variant="outline" size="sm" className="min-h-11 md:min-h-7" onClick={onOpen}>
          {t("goTo")}
        </Button>
        {canEdit && annotation.kind !== "bookmark" ? (
          <Button type="button" variant="ghost" size="sm" className="min-h-11 md:min-h-7" onClick={onEdit}>
            <IconPencil aria-hidden />
            {t("edit")}
          </Button>
        ) : null}
        {canEdit ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive min-h-11 md:min-h-7"
            onClick={onAskRemove}
          >
            <IconTrash aria-hidden />
            {t("delete")}
          </Button>
        ) : null}
        {unsent ? (
          <>
            <Button type="button" variant="ghost" size="sm" className="min-h-11 md:min-h-7" onClick={onRetry}>
              <IconRefresh aria-hidden />
              {t("retry")}
            </Button>
            {annotation.sync === "failed" ? (
              <Button type="button" variant="ghost" size="sm" className="min-h-11 md:min-h-7" onClick={onDiscard}>
                {t("discard")}
              </Button>
            ) : null}
          </>
        ) : null}
      </div>
    </li>
  )
}

/**
 * The highlights, notes and bookmarks of the open file in reading order. A panel on wide screens and the body of a
 * bottom sheet on phones. A change that did not reach the server stays in the list with its state and a Retry.
 */
export function AnnotationList({
  annotations,
  activeId,
  canEdit,
  onOpen,
  onEdit,
  onRemove,
  onRetry,
  onDiscard,
}: AnnotationListProps) {
  const t = useT("library.annotation")
  const [removing, setRemoving] = useState<ViewAnnotation | null>(null)
  const ordered = byPosition(annotations)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
      {!canEdit ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconHighlight aria-hidden />
            </EmptyMedia>
            <EmptyTitle>{t("signInTitle")}</EmptyTitle>
            <EmptyDescription>{t("signIn")}</EmptyDescription>
          </EmptyHeader>
          <SignInLink />
        </Empty>
      ) : ordered.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconHighlight aria-hidden />
            </EmptyMedia>
            <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
            <EmptyDescription>{t("empty")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="flex flex-col gap-2" aria-label={t("panelTitle")}>
          {ordered.map((annotation) => (
            <Card
              key={annotation.client_id}
              annotation={annotation}
              active={annotation.id === activeId}
              canEdit={canEdit}
              onOpen={() => onOpen(annotation)}
              onEdit={() => onEdit(annotation)}
              onAskRemove={() => setRemoving(annotation)}
              onRetry={() => onRetry(annotation)}
              onDiscard={() => onDiscard(annotation)}
            />
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) setRemoving(null)
        }}
        title={t("deleteTitle")}
        description={removing?.quote ? <span className="line-clamp-3">{removing.quote}</span> : t("deleteHint")}
        confirmLabel={t("delete")}
        destructive
        onConfirm={() => {
          if (removing) onRemove(removing)
          setRemoving(null)
        }}
      />
    </div>
  )
}
