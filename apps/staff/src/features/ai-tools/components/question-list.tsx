"use client"

import { useT } from "@ihsp/i18n"
import { Button, Checkbox, IconCheck, IconEdit, IconPlus, IconTrash, Pill } from "@ihsp/ui"
import { useState } from "react"
import { AI_AUTHOR, EMIS_SUBJECTS, isMulti, type BankQuestion, type Difficulty, type MockQuestion } from "../mock-data"
import { QuestionEditDialog } from "./question-edit-dialog"
import { SaveToBankDialog } from "./save-to-bank-dialog"
import { NotebookSaved } from "./saved-to"

/**
 * Questions: pick, edit, replace or remove them, then act. New AI questions can go to the bank and to the notebook (only
 * the selected ones, only on the teacher's click); a pick from the bank is not new material and is never stored.
 */
export function QuestionList({
  questions: initial,
  destination,
  subjectId,
  difficulty = "medium",
  topic = "",
  canSaveToBank = false,
  inDialog = false,
  onShuffle,
}: {
  questions: MockQuestion[]
  destination?: string
  subjectId: string
  difficulty?: Difficulty
  topic?: string
  canSaveToBank?: boolean
  inDialog?: boolean
  onShuffle?: () => void
}) {
  const t = useT("aiTools")
  const [questions, setQuestions] = useState(initial)
  const [picked, setPicked] = useState<string[]>(() => initial.map((q) => q.id))
  const [bankOpen, setBankOpen] = useState(false)
  const [editing, setEditing] = useState<MockQuestion | null>(null)
  const subject = EMIS_SUBJECTS.find((s) => s.id === subjectId)
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  const remove = (id: string) => {
    setQuestions((qs) => qs.filter((q) => q.id !== id))
    setPicked((p) => p.filter((x) => x !== id))
  }
  const asBank = (q: MockQuestion): BankQuestion => ({
    ...q,
    subjectId,
    topicId: subject?.topics[0]?.id ?? "",
    difficulty,
    author: AI_AUTHOR,
  })
  const chosen = questions.filter((q) => picked.includes(q.id))
  return (
    <div className={`flex flex-col gap-3 ${inDialog ? "" : "pb-24 md:pb-4"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone="primary">{t("questions.selected", { count: picked.length })}</Pill>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setPicked(picked.length === questions.length ? [] : questions.map((q) => q.id))}
        >
          {t("questions.selectAll")}
        </Button>
        {onShuffle ? (
          <Button type="button" variant="outline" size="sm" onClick={onShuffle}>
            {t("questions.shuffleAgain")}
          </Button>
        ) : null}
      </div>
      <ol className="flex flex-col gap-3">
        {questions.map((q, i) => (
          <li key={q.id} className="bg-card ring-foreground/10 flex gap-3 rounded-card p-4 ring-1">
            <Checkbox
              checked={picked.includes(q.id)}
              onCheckedChange={() => toggle(q.id)}
              aria-label={`${i + 1}. ${q.text}`}
              className="mt-1"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <p className="font-medium break-words">
                {i + 1}. {q.text}
              </p>
              {isMulti(q) ? <Pill tone="warning" className="self-start">{t("questions.multi")}</Pill> : null}
              <ul className="flex flex-col gap-1 text-sm">
                {q.options.map((o, oi) => {
                  const ok = q.correct.includes(oi)
                  return (
                    <li key={o} className={ok ? "text-success flex items-start gap-1.5 font-semibold" : "text-muted-foreground ps-5.5"}>
                      {ok ? <IconCheck className="mt-0.5 size-4 shrink-0" aria-hidden /> : null}
                      <span>
                        {String.fromCharCode(65 + oi)}. {o}
                        {ok ? ` · ${t("questions.correct")}` : ""}
                      </span>
                    </li>
                  )
                })}
              </ul>
              <div className="-ms-2 flex flex-wrap gap-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(q)}>
                  <IconEdit aria-hidden />
                  {t("bank.edit")}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => remove(q.id)}>
                  <IconTrash aria-hidden />
                  {t("questions.remove")}
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <div
        className={`bg-background/95 ring-foreground/10 z-10 flex flex-col gap-3 rounded-card p-3 ring-1 backdrop-blur ${inDialog ? "sticky bottom-0" : "sticky bottom-20 md:bottom-2"}`}
      >
        <div className="flex flex-wrap gap-2">
          {canSaveToBank ? (
            <Button type="button" variant="outline" disabled={picked.length === 0} onClick={() => setBankOpen(true)}>
              {t("questions.saveToBank")}
            </Button>
          ) : null}
        </div>
        {destination ? <NotebookSaved destination={destination} /> : null}
      </div>
      {editing ? (
        <QuestionEditDialog
          key={editing.id}
          question={asBank(editing)}
          onClose={() => setEditing(null)}
          onSave={(q) => {
            setQuestions((qs) => qs.map((x) => (x.id === q.id ? { id: q.id, text: q.text, options: q.options, correct: q.correct } : x)))
            setEditing(null)
          }}
        />
      ) : null}
      <SaveToBankDialog
        open={bankOpen}
        onOpenChange={setBankOpen}
        questions={chosen}
        difficulty={difficulty}
        subjectId={subjectId}
        topic={topic}
      />
    </div>
  )
}
