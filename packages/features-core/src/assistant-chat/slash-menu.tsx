"use client"

import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { IconX } from "@ihsp/ui"
import { useEffect, useRef } from "react"
import { slashInfo, type SlashCommandInfo, type SlashName } from "./slash-commands"

export type SlashMenuProps = {
  /** Id of the listbox; the field points at it with `aria-controls`. */
  id: string
  items: readonly SlashCommandInfo[]
  active: number
  onPick: (name: SlashName) => void
  onHover: (index: number) => void
}

export function slashOptionId(id: string, index: number): string {
  return `${id}-option-${index}`
}

/**
 * The command list above a composer: icon, `/name`, a one-line description. It is a listbox the field drives
 * (`aria-activedescendant`), so focus never leaves the text field; a press picks, so the field keeps its caret.
 */
export function SlashMenu({ id, items, active, onPick, onHover }: SlashMenuProps) {
  const t = useT("assistant.slash")
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.children[active]?.scrollIntoView?.({ block: "nearest" })
  }, [active])

  return (
    <div className="bg-popover text-popover-foreground absolute inset-x-0 bottom-full z-30 mb-2 overflow-hidden rounded-2xl border shadow-lg">
      <p className="text-muted-foreground border-b px-3 py-1.5 text-xs font-medium">{t("menu")}</p>
      {items.length === 0 ? (
        <p role="status" className="text-muted-foreground px-3 py-3 text-sm">
          {t("empty")}
        </p>
      ) : (
        <div ref={listRef} id={id} role="listbox" aria-label={t("menu")} className="max-h-64 overflow-y-auto p-1">
          {items.map((item, index) => {
            const Icon = item.icon
            return (
              <div
                key={item.name}
                id={slashOptionId(id, index)}
                role="option"
                tabIndex={-1}
                aria-selected={index === active}
                data-slash-option={item.name}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-2.5 py-1.5 md:min-h-10",
                  index === active && "bg-muted",
                )}
                onMouseDown={(event) => {
                  event.preventDefault()
                  onPick(item.name)
                }}
                onMouseMove={() => onHover(index)}
              >
                <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="flex min-w-0 flex-col leading-tight">
                  <span className="text-sm font-medium">
                    /{item.name}
                    <span className="text-muted-foreground ms-2 font-normal">{t(`${item.name}.title`)}</span>
                  </span>
                  <span className="text-muted-foreground truncate text-xs">{t(`${item.name}.hint`)}</span>
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** The chip that stands for a picked command inside a composer or a sent message. */
export function SlashChip({ name, onRemove }: { name: SlashName; onRemove?: () => void }) {
  const t = useT("assistant.slash")
  const Icon = slashInfo(name).icon
  return (
    <span
      data-slash-chip={name}
      className="bg-primary/10 text-primary inline-flex h-7 shrink-0 items-center gap-1 rounded-full ps-2 pe-2.5 text-sm font-medium"
    >
      <Icon className="size-3.5" aria-hidden />/{name}
      {onRemove ? (
        <button
          type="button"
          className="hover:bg-primary/15 -me-1.5 inline-flex size-6 items-center justify-center rounded-full"
          aria-label={t("remove", { name })}
          onClick={onRemove}
        >
          <IconX className="size-3.5" aria-hidden />
        </button>
      ) : null}
    </span>
  )
}
