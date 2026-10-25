"use client"

import type { ResourceItem } from "@ihsp/api"
import { AddToNotebookMenu } from "@ihsp/features-core"
import { useFormatters, useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { IconNotebook } from "@ihsp/ui"
import { LinkButton } from "../../shared/components/link-button"
import { formatBytes } from "../../shared/utils/format-bytes"
import { fullName } from "../../shared/utils/people"
import { ResourcePreview, canPreview } from "./resource-preview"

/**
 * Materials and attachments of a lesson: title, author, size, a preview of files the browser can show, an open link
 * (the short link) and, for the student's own attachments, a delete button (WEB-11).
 */
export function ResourceList({
  items,
  currentUserId,
  onDelete,
}: {
  items: ResourceItem[]
  currentUserId?: string
  onDelete?: (item: ResourceItem) => void
}) {
  const t = useT("lesson.resources")
  const tNotebook = useT("assistant.addToNotebook")
  const f = useFormatters()
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li
          key={item.link_id}
          className="flex min-h-11 items-center gap-3 rounded-lg border p-2"
          data-testid="resource-item"
        >
          {item.kind === "file" ? (
            <Icons.page className="text-muted-foreground size-5 shrink-0" aria-hidden />
          ) : (
            <Icons.links className="text-muted-foreground size-5 shrink-0" aria-hidden />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              <a href={item.short_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {item.title}
              </a>
            </p>
            <p className="text-muted-foreground truncate text-xs">
              {[
                fullName(item.author),
                item.file ? formatBytes(item.file.byte_size) : null,
                f.date(item.created_at, { day: "numeric", month: "short" }),
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          {item.kind === "file" && canPreview(item.file) ? (
            <ResourcePreview file={item.file} title={item.title} />
          ) : null}
          <LinkButton
            href={item.short_url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
            aria-label={t("openItem", { title: item.title })}
          >
            {t("open")}
          </LinkButton>
          {item.hidden ? null : (
            <AddToNotebookMenu
              input={{ kind: "lesson_resource", lesson_id: item.lesson_id, link_id: item.link_id }}
              trigger={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-11 shrink-0 md:size-8"
                  aria-label={tNotebook("itemLabel", { title: item.title })}
                >
                  <IconNotebook aria-hidden />
                </Button>
              }
            />
          )}
          {onDelete && currentUserId && item.author.id === currentUserId ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-11 shrink-0 md:size-8"
              aria-label={t("deleteItem", { title: item.title })}
              onClick={() => onDelete(item)}
            >
              <Icons.trash aria-hidden />
            </Button>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
