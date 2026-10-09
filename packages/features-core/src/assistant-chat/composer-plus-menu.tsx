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
import {
  IconBooks,
  IconCards,
  IconFiles,
  IconListCheck,
  IconListNumbers,
  IconNotebook,
  IconNotes,
  IconPlus,
  IconSchool,
  IconUpload,
  IconWorld,
  type Icon,
} from "@tabler/icons-react"
import { useRef, type RefObject } from "react"
import { useNotebooks } from "../notebooks/api"
import type { WebQuotaState } from "../web-search"

const ITEM_CLASS = "min-h-11 md:min-h-8"
const PICKER_NOTEBOOKS = 8

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
  icon: Icon
  label: string
  /** The text that goes into the field when the item is picked. */
  prompt: string
  onPick: (prompt: string) => void
}

function StudyToolItem({ icon: ToolIcon, label, prompt, onPick }: StudyToolItemProps) {
  return (
    <DropdownMenuItem className={ITEM_CLASS} onClick={() => onPick(prompt)}>
      <ToolIcon aria-hidden />
      {label}
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
  /** A study tool was picked: the composer puts the localized template into the field. */
  onStudyTool: (template: string) => void
  /** The message field: it gets the focus back after a study tool filled it (otherwise the "+" button does). */
  fieldRef: RefObject<HTMLElement | null>
  onUpload: () => void
  onPickFiles: () => void
  onAskNotebook: (notebook: NotebookItem) => void
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
}: ComposerPlusMenuProps) {
  const t = useT("assistant.composer")
  const toolPicked = useRef(false)

  function pickTool(template: string) {
    toolPicked.current = true
    onStudyTool(template)
  }

  return (
    <DropdownMenu>
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
              <StudyToolItem
                icon={IconCards}
                label={t("studyTools.flashcards")}
                prompt={t("studyTools.flashcardsPrompt")}
                onPick={pickTool}
              />
              <StudyToolItem
                icon={IconListCheck}
                label={t("studyTools.quiz")}
                prompt={t("studyTools.quizPrompt")}
                onPick={pickTool}
              />
              <StudyToolItem
                icon={IconListNumbers}
                label={t("studyTools.explain")}
                prompt={t("studyTools.explainPrompt")}
                onPick={pickTool}
              />
              <StudyToolItem
                icon={IconNotes}
                label={t("studyTools.conspect")}
                prompt={t("studyTools.conspectPrompt")}
                onPick={pickTool}
              />
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
