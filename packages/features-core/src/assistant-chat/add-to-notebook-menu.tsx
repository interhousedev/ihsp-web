"use client"

import type { SourceInput } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@ihsp/ui"
import { IconNotebook, IconPlus } from "@ihsp/ui"
import { isValidElement, type ReactNode } from "react"
import { useAddToNotebook } from "./use-add-to-notebook"

export type AddToNotebookInput = SourceInput | SourceInput[]

const ITEM_CLASS = "min-h-11 md:min-h-8"

/** The body of the menu: a label, the recent notebooks and **New notebook**. Render it inside a menu content. */
export function AddToNotebookItems({ input }: { input: AddToNotebookInput }) {
  const t = useT("assistant.addToNotebook")
  const { recent, loading, pending, addTo, addToNew } = useAddToNotebook(input)

  return (
    <>
      <DropdownMenuGroup>
        <DropdownMenuLabel>{t("choose")}</DropdownMenuLabel>
        {loading ? (
          <DropdownMenuItem disabled className={ITEM_CLASS}>
            …
          </DropdownMenuItem>
        ) : null}
        {recent.map((notebook) => (
          <DropdownMenuItem
            key={notebook.id}
            className={ITEM_CLASS}
            disabled={pending}
            onClick={() => void addTo(notebook)}
          >
            <span aria-hidden>{notebook.emoji ?? "📓"}</span>
            <span className="min-w-0 truncate">{notebook.title}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem className={ITEM_CLASS} disabled={pending} onClick={() => void addToNew()}>
        <IconPlus aria-hidden />
        {t("new")}
      </DropdownMenuItem>
    </>
  )
}

/**
 * "Add to notebook ▸" as an entry of another dropdown menu (chat ⋯ menu, file row menu, lesson material menu…).
 * Place it inside a `DropdownMenuContent`.
 */
export function AddToNotebookSubMenu({ input, label }: { input: AddToNotebookInput; label?: string }) {
  const t = useT("assistant.addToNotebook")
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className={ITEM_CLASS}>
        <IconNotebook aria-hidden />
        {label ?? t("title")}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-56">
        <AddToNotebookItems input={input} />
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}

export type AddToNotebookMenuProps = {
  input: AddToNotebookInput
  /** The element that opens the menu (a button); defaults to an outline button "Add to notebook". */
  trigger?: ReactNode
}

/** Stand-alone "Add to notebook" dropdown: pick a recent notebook or create one; a toast offers **Open notebook**. */
export function AddToNotebookMenu({ input, trigger }: AddToNotebookMenuProps) {
  const t = useT("assistant.addToNotebook")
  return (
    <DropdownMenu>
      {isValidElement(trigger) ? (
        <DropdownMenuTrigger render={trigger} />
      ) : (
        <DropdownMenuTrigger render={<Button type="button" variant="outline" className="min-h-11 md:min-h-8" />}>
          {trigger ?? (
            <>
              <IconNotebook aria-hidden />
              {t("title")}
            </>
          )}
        </DropdownMenuTrigger>
      )}
      <DropdownMenuContent align="end" className="w-60">
        <AddToNotebookItems input={input} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
