"use client"

import { useT } from "@ihsp/i18n"
import { Button, IconLoader, IconSparkles, Input, StateView, Textarea } from "@ihsp/ui"
import { useState } from "react"
import { useWorkCheck } from "../hooks/use-ai-tools"
import { FieldRow, SubjectGroupFields, useDefaultSubject, useNotebookName } from "./form-bits"
import { NotebookHint, NotebookSaved } from "./saved-to"
import { WorkCheckResultView } from "./work-check-result"

/** "Проверка работы": one large text field, one action; criteria and AI signs come as two result tabs. The result always goes to the subject notebook. */
export function WorkCheckPanel() {
  const t = useT("aiTools")
  const { result, pending, error, run } = useWorkCheck()
  const defaultSubject = useDefaultSubject()
  const [subjectChoice, setSubjectChoice] = useState("")
  const subjectId = subjectChoice || defaultSubject
  const [groupId, setGroupId] = useState("")
  const [text, setText] = useState("")
  const [rubric, setRubric] = useState("")
  const [editing, setEditing] = useState(true)
  const destination = useNotebookName(subjectId, groupId)
  const ready = text.trim().length > 0 && subjectId !== ""
  const collapsed = result !== null && !editing
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          setEditing(false)
          run({ text, subjectId, groupId: groupId || null, rubric })
        }}
      >
        {collapsed ? (
          <div className="bg-card ring-foreground/10 flex flex-col gap-2 rounded-card p-4 ring-1">
            <p className="text-muted-foreground line-clamp-3 text-sm">{text}</p>
            <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setEditing(true)}>
              {t("workCheck.editText")}
            </Button>
          </div>
        ) : (
          <>
            <label htmlFor="w-text" className="sr-only">
              {t("form.text")}
            </label>
            <Textarea
              id="w-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("workCheck.placeholder")}
              className="min-h-72 max-h-[70vh] p-4 text-base leading-relaxed md:text-base"
            />
            <FieldRow label={t("form.criteria")} htmlFor="w-crit">
              <Input id="w-crit" value={rubric} onChange={(e) => setRubric(e.target.value)} placeholder={t("form.criteriaPlaceholder")} className="min-h-11 md:min-h-8" />
            </FieldRow>
            <SubjectGroupFields subjectId={subjectId} groupId={groupId} onSubject={setSubjectChoice} onGroup={setGroupId} idPrefix="w" />
          </>
        )}
        <NotebookHint destination={destination} />
        <Button type="submit" size="lg" className="self-start" disabled={(!ready && !collapsed) || pending}>
          {pending ? <IconLoader className="animate-spin" aria-hidden /> : <IconSparkles aria-hidden />}
          {pending ? t("workCheck.checking") : result ? t("workCheck.runAgain") : t("workCheck.run")}
        </Button>
      </form>
      <section aria-live="polite" className="flex flex-col gap-3">
        {pending ? <StateView state="loading" /> : null}
        {error ? <p className="text-destructive text-sm">{t("workCheck.failed")}</p> : null}
        {result ? (
          <>
            <WorkCheckResultView result={result} />
            <NotebookSaved destination={destination} />
          </>
        ) : null}
      </section>
    </div>
  )
}
