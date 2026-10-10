"use client"

import type { ChatConfig, ChatStyle, NotebookDetail } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Button,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  NativeSelect,
  NativeSelectOption,
  Textarea,
  ToggleGroup,
  ToggleGroupItem,
} from "@ihsp/ui"
import { useId, useState } from "react"
import { useUpdateNotebook } from "../api"
import { useNotebookErrorMessage } from "../lib"

export const MAX_CUSTOM_PROMPT = 1000
/** What the student is working on; the backend keeps at most this many characters (`chat_config.goal`). */
export const MAX_GOAL = 300

const STYLES = [
  { value: "default", label: "style.default.label" },
  { value: "learning_guide", label: "style.learning_guide.label" },
  { value: "custom", label: "style.custom" },
] as const satisfies readonly { value: ChatStyle; label: string }[]

const LENGTHS = ["default", "shorter", "longer"] as const satisfies readonly ChatConfig["length"][]
const LANGUAGES = ["auto", "uz", "ru", "en"] as const satisfies readonly ChatConfig["language"][]

type ChatConfigFormProps = {
  notebook: NotebookDetail
  onClose: () => void
}

/**
 * The body of the Configure chat dialog: the goal, the style (three segments), the answer length (three segments) and
 * the answer language (a small select). Course staff who
 * may only read the workspace (`can_write === false`) see the configuration but cannot change it. Mounted per opening.
 */
export function ChatConfigForm({ notebook, onClose }: ChatConfigFormProps) {
  const t = useT("notebooks.config")
  const tc = useT("common")
  const tcourse = useT("notebooks.course")
  const errorMessage = useNotebookErrorMessage()
  const update = useUpdateNotebook(notebook.id)
  const ids = useId()
  const config = notebook.chat_config
  const [style, setStyle] = useState<ChatStyle>(config.style)
  const [customPrompt, setCustomPrompt] = useState(config.custom_prompt ?? "")
  const [length, setLength] = useState<ChatConfig["length"]>(config.length)
  const [language, setLanguage] = useState<ChatConfig["language"]>(config.language)
  const [goal, setGoal] = useState(config.goal ?? "")

  const readOnly = notebook.can_write === false
  const prompt = customPrompt.trim()
  const canSave = !readOnly && !update.isPending && (style !== "custom" || prompt !== "")

  function save() {
    if (!canSave) return
    const text = goal.trim()
    update.mutate(
      {
        chat_config: {
          style,
          custom_prompt: prompt === "" ? null : prompt,
          length,
          language,
          goal: text === "" ? null : text,
        },
      },
      { onSuccess: onClose },
    )
  }

  return (
    <form
      className="flex min-w-0 flex-col gap-3.5"
      onSubmit={(event) => {
        event.preventDefault()
        save()
      }}
    >
      <DialogHeader>
        <DialogTitle>{t("title")}</DialogTitle>
      </DialogHeader>

      {readOnly ? <p className="text-muted-foreground text-sm">{tcourse("readOnlySources")}</p> : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${ids}-goal`}>{t("goal.label")}</Label>
        <Textarea
          id={`${ids}-goal`}
          value={goal}
          maxLength={MAX_GOAL}
          rows={2}
          disabled={readOnly}
          placeholder={t("goal.placeholder")}
          className="min-h-16 resize-y"
          onChange={(event) => setGoal(event.target.value)}
        />
        <p className="text-muted-foreground flex justify-end gap-2 text-xs">
          <span className="shrink-0 tabular-nums">{t("goal.left", { count: MAX_GOAL - goal.length })}</span>
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span id={`${ids}-style`} className="text-sm font-medium">
          {t("style.label")}
        </span>
        <ToggleGroup
          value={[style]}
          variant="outline"
          disabled={readOnly}
          aria-labelledby={`${ids}-style`}
          className="w-full"
          onValueChange={(values) => {
            const next = STYLES.find((option) => option.value === values[0])
            if (next) setStyle(next.value)
          }}
        >
          {STYLES.map((option) => (
            <ToggleGroupItem key={option.value} value={option.value} className="min-h-11 flex-1 px-2 md:min-h-8">
              {t(option.label)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {style === "custom" ? (
          <div className="flex flex-col gap-1">
            <Textarea
              value={customPrompt}
              maxLength={MAX_CUSTOM_PROMPT}
              rows={3}
              disabled={readOnly}
              aria-label={t("customLabel")}
              placeholder={t("custom.placeholder")}
              className="min-h-20 resize-y"
              onChange={(event) => setCustomPrompt(event.target.value)}
            />
            <p className="text-muted-foreground flex justify-end gap-2 text-xs">
              <span className="shrink-0 tabular-nums">
                {t("customCount", { count: customPrompt.length, max: MAX_CUSTOM_PROMPT })}
              </span>
            </p>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <span id={`${ids}-length`} className="text-sm font-medium">
          {t("length.label")}
        </span>
        <ToggleGroup
          value={[length]}
          variant="outline"
          disabled={readOnly}
          aria-labelledby={`${ids}-length`}
          className="w-full"
          onValueChange={(values) => {
            const next = LENGTHS.find((value) => value === values[0])
            if (next) setLength(next)
          }}
        >
          {LENGTHS.map((value) => (
            <ToggleGroupItem key={value} value={value} className="min-h-11 flex-1 px-3 md:min-h-8">
              {t(`length.${value}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={`${ids}-language`}>{t("language.label")}</Label>
        <NativeSelect
          id={`${ids}-language`}
          value={language}
          disabled={readOnly}
          className="min-h-11 w-40 md:min-h-8"
          onChange={(event) => {
            const next = LANGUAGES.find((value) => value === event.target.value)
            if (next) setLanguage(next)
          }}
        >
          {LANGUAGES.map((value) => (
            <NativeSelectOption key={value} value={value}>
              {t(`language.${value}`)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      {update.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(update.error)}
        </p>
      ) : null}

      {readOnly ? null : (
        <DialogFooter>
          <Button type="button" variant="outline" className="min-h-11" onClick={onClose}>
            {tc("cancel")}
          </Button>
          <Button type="submit" className="min-h-11" disabled={!canSave}>
            {tc("save")}
          </Button>
        </DialogFooter>
      )}
    </form>
  )
}
