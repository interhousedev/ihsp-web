"use client"

import type { ManageQueueRow } from "@ihsp/api"
import { useRef, type KeyboardEvent } from "react"
import { QueueRowView } from "./queue-row"
import { rowKey } from "./queue-utils"

/**
 * The list of the queue (the left side of the split view). Rows are buttons; the arrow keys move the selection
 * from inside the list, the letter shortcuts (`j` and `k` here, `a` `c` `r` `h` for the actions) work anywhere on the
 * page and are wired by `useQueueShortcuts`.
 */
export function QueueTable({
  rows,
  selectedKey,
  blocked,
  label,
  onSelect,
}: {
  rows: readonly ManageQueueRow[]
  selectedKey: string | null
  /** Keys of rows the API refused to approve because the librarian uploaded them. */
  blocked: ReadonlySet<string>
  label: string
  onSelect: (key: string) => void
}) {
  const listRef = useRef<HTMLUListElement>(null)

  function move(step: 1 | -1) {
    const index = rows.findIndex((row) => rowKey(row) === selectedKey)
    const next = rows[index < 0 ? (step === 1 ? 0 : rows.length - 1) : index + step]
    if (!next) return
    const key = rowKey(next)
    onSelect(key)
    requestAnimationFrame(() => {
      const items = Array.from(listRef.current?.querySelectorAll<HTMLElement>("[data-queue-key]") ?? [])
      items
        .find((item) => item.getAttribute("data-queue-key") === key)
        ?.querySelector("button")
        ?.focus()
    })
  }

  function onKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      move(1)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      move(-1)
    }
  }

  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- arrow keys bubble up from the focusable row buttons
    <ul ref={listRef} aria-label={label} className="flex flex-col gap-2" onKeyDown={onKeyDown}>
      {rows.map((row) => {
        const key = rowKey(row)
        return (
          <li key={key} data-queue-key={key}>
            <QueueRowView
              row={row}
              selected={key === selectedKey}
              needsAnotherLibrarian={blocked.has(key)}
              onSelect={() => onSelect(key)}
            />
          </li>
        )
      })}
    </ul>
  )
}
