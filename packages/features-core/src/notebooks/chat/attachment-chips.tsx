"use client"

import { useT } from "@ihsp/i18n"
import { Badge, Spinner } from "@ihsp/ui"
import { IconBook, IconFile, IconSchool, IconX } from "@ihsp/ui"
import type { AttachedItem } from "./chat-attachments"

const ICONS = { lesson: IconSchool, material: IconBook, file: IconFile } as const

/** The chips above the composer field: what the next question is about, each removable. */
export function AttachmentChips({
  items,
  onRemove,
}: {
  items: readonly AttachedItem[]
  onRemove: (key: string) => void
}) {
  const t = useT("notebooks")
  if (items.length === 0) return null
  return (
    <ul className="flex flex-wrap items-center gap-1 pt-1" aria-label={t("attach.chips")}>
      {items.map((item) => {
        const Icon = ICONS[item.kind]
        const pending = item.kind === "file" && item.pending === true
        return (
          <li key={item.key}>
            <Badge variant="secondary" className="max-w-64 gap-1 pe-0.5">
              {pending ? <Spinner className="size-3.5" aria-hidden /> : <Icon aria-hidden />}
              <span className="truncate">{item.label}</span>
              <button
                type="button"
                className="hover:bg-background focus-visible:ring-ring inline-flex size-6 shrink-0 items-center justify-center rounded-full outline-hidden focus-visible:ring-2"
                aria-label={t("attach.remove", { label: item.label })}
                onClick={() => onRemove(item.key)}
              >
                <IconX className="size-3.5" aria-hidden />
              </button>
            </Badge>
          </li>
        )
      })}
    </ul>
  )
}
