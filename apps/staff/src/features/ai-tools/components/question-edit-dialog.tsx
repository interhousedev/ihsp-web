"use client"

import { useT } from "@ihsp/i18n"
import { Button, Checkbox, IconPlus, IconX, Input, ResponsiveDialog, Textarea } from "@ihsp/ui"
import { useState } from "react"
import { EMIS_SUBJECTS, type BankQuestion, type Difficulty } from "../mock-data"
import { FieldRow, NativeSelect } from "./form-bits"

/** Full edit of one question: text, every option with a "correct" mark, difficulty and the EMIS topic. Also creates a question by hand. */
export function QuestionEditDialog({
  question,
  isNew = false,
  onClose,
  onSave,
}: {
  question: BankQuestion
  isNew?: boolean
  onClose: () => void
  onSave: (q: BankQuestion) => void
}) {
  const t = useT("aiTools")
  const [text, setText] = useState(question.text)
  const [difficulty, setDifficulty] = useState<Difficulty>(question.difficulty)
  const [subjectId, setSubjectId] = useState(question.subjectId)
  const [topicId, setTopicId] = useState(question.topicId)
  const [options, setOptions] = useState(question.options.length > 0 ? question.options : ["", "", "", ""])
  const [correct, setCorrect] = useState<number[]>(question.correct)
  const subject = EMIS_SUBJECTS.find((s) => s.id === subjectId)
  const filled = options.filter((o) => o.trim() !== "").length
  const valid = text.trim() !== "" && filled >= 2 && correct.some((i) => (options[i] ?? "").trim() !== "")
  const toggle = (i: number) => setCorrect((c) => (c.includes(i) ? c.filter((x) => x !== i) : [...c, i]))
  const remove = (i: number) => {
    setOptions((o) => o.filter((_, x) => x !== i))
    setCorrect((c) => c.filter((x) => x !== i).map((x) => (x > i ? x - 1 : x)))
  }
  return (
    <ResponsiveDialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={isNew ? t("bank.addTitle") : t("bank.editTitle")}
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("addToTest.cancel")}
          </Button>
          <Button
            type="button"
            disabled={!valid}
            onClick={() => {
              const keep = options.map((o, i) => ({ o: o.trim(), ok: correct.includes(i) })).filter((x) => x.o !== "")
              onSave({
                ...question,
                text: text.trim(),
                difficulty,
                subjectId,
                topicId,
                options: keep.map((x) => x.o),
                correct: keep.flatMap((x, i) => (x.ok ? [i] : [])),
              })
            }}
          >
            {t("bank.save")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FieldRow label={t("bank.questionText")} htmlFor="qe-text">
          <Textarea id="qe-text" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
        </FieldRow>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">{t("bank.options")}</legend>
          <p className="text-muted-foreground text-sm">{t("bank.optionsHint")}</p>
          <ul className="flex flex-col gap-2">
            {options.map((o, i) => (
              <li key={i} className="flex items-center gap-2">
                <Checkbox
                  checked={correct.includes(i)}
                  onCheckedChange={() => toggle(i)}
                  aria-label={t("bank.markCorrect", { n: String.fromCharCode(65 + i) })}
                />
                <span className="text-muted-foreground w-5 text-sm">{String.fromCharCode(65 + i)}</span>
                <Input
                  value={o}
                  onChange={(e) => setOptions((all) => all.map((x, xi) => (xi === i ? e.target.value : x)))}
                  aria-label={`${t("bank.option")} ${String.fromCharCode(65 + i)}`}
                  className={`min-h-11 md:min-h-8 ${correct.includes(i) ? "border-success" : ""}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={options.length <= 2}
                  onClick={() => remove(i)}
                  aria-label={t("bank.removeOption")}
                >
                  <IconX aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
          {options.length < 8 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="self-start"
              onClick={() => setOptions((o) => [...o, ""])}
            >
              <IconPlus aria-hidden />
              {t("bank.addOption")}
            </Button>
          ) : null}
        </fieldset>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <FieldRow label={t("form.subject")} htmlFor="qe-subject">
            <NativeSelect
              id="qe-subject"
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value)
                setTopicId(EMIS_SUBJECTS.find((s) => s.id === e.target.value)?.topics[0]?.id ?? "")
              }}
            >
              {EMIS_SUBJECTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </NativeSelect>
          </FieldRow>
          <FieldRow label={t("form.emisTopic")} htmlFor="qe-topic">
            <NativeSelect id="qe-topic" value={topicId} onChange={(e) => setTopicId(e.target.value)}>
              {subject?.topics.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </NativeSelect>
          </FieldRow>
          <FieldRow label={t("form.difficulty")} htmlFor="qe-diff">
            <NativeSelect id="qe-diff" value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
              {(["easy", "medium", "hard"] as const).map((d) => (
                <option key={d} value={d}>
                  {t(`difficulty.${d}`)}
                </option>
              ))}
            </NativeSelect>
          </FieldRow>
        </div>
      </div>
    </ResponsiveDialog>
  )
}
