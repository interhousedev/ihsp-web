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
  RadioGroup,
  RadioGroupItem,
  Textarea,
  ToggleGroup,
  ToggleGroupItem,
} from "@ihsp/ui"
import { useId, useState } from "react"
import { useUpdateNotebook } from "../api"
import {
  CHAT_PRESETS,
  presetOf,
  presetPatch,
  useNotebookErrorMessage,
  type ChatPresetId,
  type ChatPresetPrompts,
} from "../lib"

export const MAX_CUSTOM_PROMPT = 1000
/** What the student is working on; the backend keeps at most this many characters (`chat_config.goal`). */
export const MAX_GOAL = 300

const STYLES = [
  { value: "default", label: "style.default.label", hint: "style.default.hint" },
  { value: "learning_guide", label: "style.learning_guide.label", hint: "style.learning_guide.hint" },
  { value: "custom", label: "style.custom", hint: null },
] as const satisfies readonly { value: ChatStyle; label: string; hint: string | null }[]

const LENGTHS = ["default", "shorter", "longer"] as const satisfies readonly ChatConfig["length"][]
const LANGUAGES = ["auto", "uz", "ru", "en"] as const satisfies readonly ChatConfig["language"][]

type ChatConfigFormProps = {
  notebook: NotebookDetail
  onClose: () => void
}

/**
 * The body of the Configure chat dialog: preset buttons, the goal, style cards, response length and answer language.
 * A preset only fills style, instruction and length; what is saved is the configuration on the screen. Course staff who
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

  const prompts: ChatPresetPrompts = {
    exam: t("presets.prompt.exam"),
    simple: t("presets.prompt.simple"),
    depth: t("presets.prompt.depth"),
  }
  const preset = presetOf({ style, custom_prompt: customPrompt, length }, prompts)

  function applyPreset(id: ChatPresetId) {
    const patch = presetPatch(id, prompts)
    setStyle(patch.style)
    setCustomPrompt(patch.custom_prompt ?? "")
    setLength(patch.length)
  }

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
      className="flex min-w-0 flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        save()
      }}
    >
      <DialogHeader>
        <DialogTitle>{t("title")}</DialogTitle>
      </DialogHeader>

      {readOnly ? <p className="text-muted-foreground text-sm">{tcourse("readOnlySources")}</p> : null}

      <div className="flex flex-col gap-2">
        <span id={`${ids}-presets`} className="text-sm font-medium">
          {t("presets.label")}
        </span>
        <ToggleGroup
          value={preset ? [preset] : []}
          variant="outline"
          disabled={readOnly}
          aria-labelledby={`${ids}-presets`}
          className="w-full flex-wrap"
          onValueChange={(values) => {
            const next = CHAT_PRESETS.find((item) => item.id === values[0])
            if (next) applyPreset(next.id)
          }}
        >
          {CHAT_PRESETS.map((item) => (
            <ToggleGroupItem key={item.id} value={item.id} className="min-h-11 grow px-3 md:min-h-8">
              {t(`presets.${item.id}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

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
        <p className="text-muted-foreground flex justify-between gap-2 text-xs">
          <span>{t("goal.hint")}</span>
          <span className="shrink-0 tabular-nums">{t("goal.left", { count: MAX_GOAL - goal.length })}</span>
        </p>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">{t("style.label")}</legend>
        <RadioGroup value={style} disabled={readOnly} onValueChange={(value) => setStyle(value as ChatStyle)}>
          {STYLES.map((option) => (
            <Label
              key={option.value}
              htmlFor={`${ids}-${option.value}`}
              className="has-data-checked:border-primary has-data-checked:bg-primary/5 flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border p-3 font-normal"
            >
              <RadioGroupItem id={`${ids}-${option.value}`} value={option.value} className="mt-0.5" />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-medium">{t(option.label)}</span>
                {option.hint ? <span className="text-muted-foreground text-xs">{t(option.hint)}</span> : null}
              </span>
            </Label>
          ))}
        </RadioGroup>
        {style === "custom" ? (
          <div className="flex flex-col gap-1">
            <Textarea
              value={customPrompt}
              maxLength={MAX_CUSTOM_PROMPT}
              rows={3}
              disabled={readOnly}
              aria-label={t("customLabel")}
              placeholder={t("custom.placeholder")}
              className="min-h-24 resize-y"
              onChange={(event) => setCustomPrompt(event.target.value)}
            />
            <p className="text-muted-foreground flex justify-between gap-2 text-xs">
              <span>{t("customHint")}</span>
              <span className="shrink-0 tabular-nums">
                {t("customCount", { count: customPrompt.length, max: MAX_CUSTOM_PROMPT })}
              </span>
            </p>
          </div>
        ) : null}
      </fieldset>

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

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${ids}-language`}>{t("language.label")}</Label>
        <NativeSelect
          id={`${ids}-language`}
          value={language}
          disabled={readOnly}
          className="w-full"
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
