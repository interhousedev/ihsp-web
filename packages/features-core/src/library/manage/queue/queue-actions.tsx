"use client"

import type { ManageQueueRow, ModerationAction, QueueTab } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Kbd, buttonVariants } from "@ihsp/ui"
import {
  IconArrowBackUp,
  IconCheck,
  IconEdit,
  IconFileDiff,
  IconFlagCheck,
  IconPlayerPause,
  IconPlus,
  IconTrashX,
  IconX,
} from "@ihsp/ui"
import Link from "next/link"
import type { ComponentType } from "react"
import { manageBookEditHref } from "../../utils/hrefs"
import { actionsFor, type RowAction } from "./queue-utils"

const SHORTCUT: Partial<Record<RowAction, string>> = { approve: "a", "request-changes": "c", reject: "r", hold: "h" }
const LABEL: Record<ModerationAction, string> = {
  approve: "approve",
  "request-changes": "requestChanges",
  reject: "reject",
  hold: "hold",
  restore: "restore",
  unpublish: "unpublish",
}
const ICON: Record<ModerationAction, ComponentType<{ "aria-hidden"?: boolean }>> = {
  approve: IconCheck,
  "request-changes": IconFileDiff,
  reject: IconX,
  hold: IconPlayerPause,
  restore: IconArrowBackUp,
  unpublish: IconTrashX,
}
const VARIANT: Record<ModerationAction, "default" | "outline" | "destructive"> = {
  approve: "default",
  "request-changes": "outline",
  reject: "destructive",
  hold: "outline",
  restore: "default",
  unpublish: "destructive",
}

/**
 * The link that starts a book from a suggestion: the editor with the title prefilled, and with `suggestion` the whole
 * book form the student filled in.
 */
export function draftFromSuggestionHref(title: string, suggestionId?: string): string {
  const suggestion = suggestionId ? `&suggestion=${encodeURIComponent(suggestionId)}` : ""
  return `${manageBookEditHref()}?title=${encodeURIComponent(title)}${suggestion}`
}

/**
 * The sticky action bar under the preview. Which buttons show depends on the tab (the state of the item): review =
 * Approve / Request changes / Reject, reports = Resolve / Hold / Unpublish, held = Restore / Unpublish / Resolve,
 * rights = edit the book, suggestions = create a book draft. Approve is off for the librarian's own upload.
 */
export function QueueActions({
  tab,
  row,
  pending,
  needsAnotherLibrarian,
  onAction,
}: {
  tab: QueueTab
  row: ManageQueueRow
  pending: boolean
  needsAnotherLibrarian: boolean
  onAction: (action: ModerationAction | "resolve") => void
}) {
  const t = useT("library.manage")
  const queue = useT("library.manage.queue")
  return (
    <div
      role="group"
      aria-label={queue("actionsLabel")}
      className="bg-background sticky bottom-[calc(var(--bottom-nav-height,0px)+var(--safe-bottom,0px))] z-10 -mx-1 flex flex-wrap gap-2 border-t px-1 py-3 md:bottom-0"
    >
      {actionsFor(tab, row).map((action) => {
        if (action === "edit-rights") {
          return row.item.id ? (
            <Link
              key={action}
              href={manageBookEditHref(row.item.id)}
              className={buttonVariants({ className: "min-h-11 md:min-h-8" })}
            >
              <IconEdit aria-hidden />
              {queue("editRights")}
            </Link>
          ) : null
        }
        if (action === "create-draft") {
          return (
            <Link
              key={action}
              href={draftFromSuggestionHref(row.suggestion?.title ?? row.item.title, row.suggestion?.id)}
              className={buttonVariants({ className: "min-h-11 md:min-h-8" })}
            >
              <IconPlus aria-hidden />
              {queue("createDraft")}
            </Link>
          )
        }
        if (action === "resolve") {
          return (
            <Button
              key={action}
              type="button"
              className="min-h-11 md:min-h-8"
              disabled={pending}
              onClick={() => onAction("resolve")}
            >
              <IconFlagCheck aria-hidden />
              {queue("resolveReports")}
            </Button>
          )
        }
        const Icon = ICON[action]
        const shortcut = SHORTCUT[action]
        const disabled = pending || (action === "approve" && needsAnotherLibrarian)
        return (
          <Button
            key={action}
            type="button"
            variant={VARIANT[action]}
            className="min-h-11 md:min-h-8"
            disabled={disabled}
            aria-keyshortcuts={shortcut}
            onClick={() => onAction(action)}
          >
            <Icon aria-hidden />
            {t(LABEL[action])}
            {shortcut ? (
              <Kbd className="hidden md:inline-flex" aria-hidden>
                {shortcut}
              </Kbd>
            ) : null}
          </Button>
        )
      })}
    </div>
  )
}
