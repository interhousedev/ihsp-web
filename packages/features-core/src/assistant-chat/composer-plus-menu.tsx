"use client"

import type { NotebookItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
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
import { IconBooks, IconFiles, IconNotebook, IconPlus, IconSchool, IconUpload, IconWorld } from "@ihsp/ui"
import { useEffect, useRef, type RefObject } from "react"
import { useNotebooks } from "../notebooks/api"
import { slashInfo, type SlashName } from "./slash-commands"
import type { WebQuotaState } from "../web-search"

const ITEM_CLASS = "min-h-11 md:min-h-8"
const PICKER_NOTEBOOKS = 8
const STUDY_TOOLS = ["cards", "quiz", "summary", "mindmap", "explain"] as const satisfies readonly SlashName[]

function NotebookPickerItems({ onPick }: { onPick: (notebook: NotebookItem) => void }) {
  const t = useT("assistant.composer")
  const notebooks = useNotebooks()
  const items = (notebooks.data?.items ?? []).slice(0, PICKER_NOTEBOOKS)

  if (notebooks.isPending) {
    return (
      <DropdownMenuItem disabled className={ITEM_CLASS}>
        …
      </DropdownMenuItem>
    )
  }
  if (items.length === 0) {
    return (
      <DropdownMenuItem disabled className={ITEM_CLASS}>
        {t("noNotebooks")}
      </DropdownMenuItem>
    )
  }
  return (
    <>
      {items.map((notebook) => (
        <DropdownMenuItem key={notebook.id} className={ITEM_CLASS} onClick={() => onPick(notebook)}>
          <span aria-hidden>{notebook.emoji ?? "📓"}</span>
          <span className="min-w-0 truncate">{notebook.title}</span>
        </DropdownMenuItem>
      ))}
    </>
  )
}

type StudyToolItemProps = {
  name: SlashName
  onPick: (name: SlashName) => void
}

function StudyToolItem({ name, onPick }: StudyToolItemProps) {
  const t = useT("assistant.slash")
  const ToolIcon = slashInfo(name).icon
  return (
    <DropdownMenuItem className={ITEM_CLASS} onClick={() => onPick(name)}>
      <ToolIcon aria-hidden />
      {t(`${name}.title`)}
    </DropdownMenuItem>
  )
}

type ComposerPlusMenuProps = {
  disabled: boolean
  guided: boolean
  onGuidedChange: (guided: boolean) => void
  /** The web-search switch; the item is not shown unless the server has web search on (`webQuota.enabled`). */
  web: boolean
  onWebChange: (web: boolean) => void
  webQuota: WebQuotaState
  /** A study tool was picked: the composer puts its command chip in front of the field. */
  onStudyTool: (name: SlashName) => void
  /** The message field: it gets the focus back after a study tool filled it (otherwise the "+" button does). */
  fieldRef: RefObject<HTMLElement | null>
  onUpload: () => void
  onPickFiles: () => void
  onAskNotebook: (notebook: NotebookItem) => void
  /** Controlled open state: the composer closes the menu when a message is sent. */
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * The "+" of the pill composer: upload, From My files, Ask a notebook ▸, and the Tools section with the Web search
 * switch (searches left today), Study tools ▸ (templates for the field) and the Guided learning toggle.
 */
export function ComposerPlusMenu({
  disabled,
  guided,
  onGuidedChange,
  web,
  onWebChange,
  webQuota,
  onStudyTool,
  fieldRef,
  onUpload,
  onPickFiles,
  onAskNotebook,
  open,
  onOpenChange,
}: ComposerPlusMenuProps) {
  const t = useT("assistant.composer")
  const toolPicked = useRef(false)

  function pickTool(name: SlashName) {
    toolPicked.current = true
    onStudyTool(name)
  }

  // Escape and a press outside close the menu even when focus has moved to the message field.
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false)
    }
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Element | null
      if (target?.closest('[data-slot="dropdown-menu-content"], [role="menu"], [aria-haspopup="menu"]')) return
      onOpenChange(false)
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onPointer)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onPointer)
    }
  }, [open, onOpenChange])

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger
        disabled={disabled}
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 shrink-0 rounded-full"
            aria-label={t("plus")}
          />
        }
      >
        <IconPlus aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="top"
        className="w-60"
        finalFocus={() => {
          if (!toolPicked.current) return true
          toolPicked.current = false
          return fieldRef.current ?? true
        }}
      >
        <DropdownMenuItem className={ITEM_CLASS} onClick={onUpload}>
          <IconUpload aria-hidden />
          {t("upload")}
        </DropdownMenuItem>
        <DropdownMenuItem className={ITEM_CLASS} onClick={onPickFiles}>
          <IconFiles aria-hidden />
          {t("myFiles")}
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className={ITEM_CLASS}>
            <IconNotebook aria-hidden />
            {t("notebook")}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-56">
            <NotebookPickerItems onPick={onAskNotebook} />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("tools")}</DropdownMenuLabel>
          {webQuota.enabled ? (
            <DropdownMenuCheckboxItem
              className={ITEM_CLASS}
              checked={web}
              disabled={webQuota.spent && !web}
              onCheckedChange={onWebChange}
            >
              <IconWorld aria-hidden />
              {t("web")}
              <span className="text-muted-foreground ms-auto text-xs">
                {t("webLeft", { count: webQuota.remaining })}
              </span>
            </DropdownMenuCheckboxItem>
          ) : null}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className={ITEM_CLASS}>
              <IconBooks aria-hidden />
              {t("studyTools.label")}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-56">
              {STUDY_TOOLS.map((name) => (
                <StudyToolItem key={name} name={name} onPick={pickTool} />
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuCheckboxItem className={ITEM_CLASS} checked={guided} onCheckedChange={onGuidedChange}>
            <IconSchool aria-hidden />
            {t("guided")}
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
