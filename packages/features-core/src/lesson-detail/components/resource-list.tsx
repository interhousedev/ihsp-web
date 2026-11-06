"use client"

import type { ResourceItem } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Button, Icons } from "@ihsp/ui"
import type { ReactNode } from "react"
import { FileOpenLink, FilePreviewButton, canPreviewFile, fileLinkProps } from "../../file-item/file-actions"
import { FileItem } from "../../file-item/file-item"
import { formatBytes } from "../utils/format-bytes"
import { fullName } from "../utils/people"

/**
 * Materials or attachments of a lesson in every app: title, author, size, a preview of files the browser can show, an
 * open link (the short link) and, for the author's own items, a delete button. Student attachments can be hidden and
 * shown again (STF-6, UF-STF-08, WEB-11).
 */
export function ResourceList({
  items,
  currentUserId,
  canDeleteAny = false,
  busyId,
  onDelete,
  onToggleHidden,
  renderActions,
}: {
  items: ResourceItem[]
  currentUserId?: string
  /** Administration may delete any item, everybody else only their own (backend: author or admin). */
  canDeleteAny?: boolean
  /** The item with a request in flight: its buttons are disabled. */
  busyId?: string | null
  onDelete?: (item: ResourceItem) => void
  onToggleHidden?: (item: ResourceItem) => void
  /** App-specific actions, such as adding to a notebook. */
  renderActions?: (item: ResourceItem) => ReactNode
}) {
  const t = useT("lessonDetail.resources")
  const f = useFormatters()
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <FileItem
          as="li"
          key={item.link_id}
          data-testid="resource-item"
          data-hidden={item.hidden}
          name={item.title}
          contentType={item.kind === "file" ? (item.file?.content_type ?? "application/octet-stream") : null}
          title={
            <a {...fileLinkProps(item.short_url)} className="hover:underline">
              {item.title}
            </a>
          }
          badge={item.hidden ? <Badge variant="outline">{t("hidden")}</Badge> : null}
          meta={[
            fullName(item.author),
            item.file ? formatBytes(item.file.byte_size) : null,
            f.date(item.created_at, { day: "numeric", month: "short" }),
          ]}
          actions={
            <>
              {item.kind === "file" && canPreviewFile(item.file) ? (
                <FilePreviewButton file={item.file} title={item.title} />
              ) : null}
              <FileOpenLink href={item.short_url} title={item.title} />
              {renderActions?.(item)}
              {onToggleHidden ? (
                <Button
                  variant="ghost"
                  className="min-h-11 md:min-h-8"
                  disabled={busyId === item.link_id}
                  aria-label={t(item.hidden ? "showItem" : "hideItem", { title: item.title })}
                  onClick={() => onToggleHidden(item)}
                >
                  {item.hidden ? t("show") : t("hide")}
                </Button>
              ) : null}
              {onDelete && currentUserId && (canDeleteAny || item.author.id === currentUserId) ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11 md:size-8"
                  disabled={busyId === item.link_id}
                  aria-label={t("deleteItem", { title: item.title })}
                  onClick={() => onDelete(item)}
                >
                  <Icons.trash aria-hidden />
                </Button>
              ) : null}
            </>
          }
        />
      ))}
    </ul>
  )
}
