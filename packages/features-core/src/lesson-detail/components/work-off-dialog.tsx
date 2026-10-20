"use client"

import type { WorkOffTemplate } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Button,
  DatePicker,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  RadioGroup,
  RadioGroupItem,
  Textarea,
} from "@ihsp/ui"
import { useId, useState } from "react"
import { draftText, type WorkOffDraft } from "../utils/work-offs"

const NO_TEMPLATE = "none"

/**
 * The work-off task of an absent student (WO-3). `choose` picks a template (or none), adds extra text and a due date;
 * `edit` changes the text and due date of a saved work-off. `requireText` keeps the button off until there is a task
 * (a common work-off and an edit need one; for one student "None" with no text means "no work-off task").
 */
export function WorkOffDialog({
  title,
  mode,
  templates,
  initial,
  requireText,
  pending = false,
  error = null,
  onSubmit,
  onClose,
}: {
  title: string
  mode: "choose" | "edit"
  templates: readonly WorkOffTemplate[]
  initial: WorkOffDraft
  requireText: boolean
  pending?: boolean
  error?: string | null
  onSubmit: (draft: WorkOffDraft) => void
  onClose: () => void
}) {
  const t = useT("lessonDetail.workOff")
  const tc = useT("common")
  const id = useId()
  const [draft, setDraft] = useState(initial)
  const hasText = draftText(draft, mode === "edit" ? [] : templates) !== ""

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {mode === "choose" ? (
          <fieldset className="flex flex-col gap-1">
            <legend className="mb-1 text-sm font-medium">{t("template")}</legend>
            <RadioGroup
              value={draft.template_id ?? NO_TEMPLATE}
              onValueChange={(value) => setDraft({ ...draft, template_id: value === NO_TEMPLATE ? null : value })}
            >
              {templates.map((template) => (
                <div key={template.id} className="flex min-h-11 items-start gap-3 py-1 md:min-h-8">
                  <RadioGroupItem value={template.id} id={`${id}-${template.id}`} className="mt-0.5" />
                  <Label htmlFor={`${id}-${template.id}`} className="font-normal">
                    {template.text}
                  </Label>
                </div>
              ))}
              <div className="flex min-h-11 items-start gap-3 py-1 md:min-h-8">
                <RadioGroupItem value={NO_TEMPLATE} id={`${id}-${NO_TEMPLATE}`} className="mt-0.5" />
                <Label htmlFor={`${id}-${NO_TEMPLATE}`} className="font-normal">
                  {tc("none")}
                </Label>
              </div>
            </RadioGroup>
          </fieldset>
        ) : null}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-text`}>{mode === "edit" ? t("text") : t("extraText")}</Label>
          <Textarea
            id={`${id}-text`}
            value={draft.text}
            rows={3}
            maxLength={2000}
            onChange={(event) => setDraft({ ...draft, text: event.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{t("dueDate")}</span>
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-full sm:w-56">
              <DatePicker
                value={draft.due_date}
                aria-label={t("dueDate")}
                placeholder={t("noDate")}
                onChange={(date) => setDraft({ ...draft, due_date: date })}
              />
            </div>
            {draft.due_date ? (
              <Button
                type="button"
                variant="ghost"
                className="min-h-11 md:min-h-8"
                onClick={() => setDraft({ ...draft, due_date: null })}
              >
                {t("clearDate")}
              </Button>
            ) : null}
          </div>
        </div>
        {error ? (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <Button variant="outline" className="min-h-11 md:min-h-8" onClick={onClose}>
            {tc("cancel")}
          </Button>
          <Button
            className="min-h-11 md:min-h-8"
            disabled={pending || (requireText && !hasText)}
            onClick={() => onSubmit(draft)}
          >
            {mode === "edit" ? tc("save") : tc("apply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
