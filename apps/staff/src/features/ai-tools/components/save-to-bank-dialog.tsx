import { useT } from "@ihsp/i18n"
import { Button, IconCircleCheck, Input, Pill, ResponsiveDialog } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"
import { saveToBank, type Difficulty } from "../api"
import type { MockQuestion } from "../mock-data"
import { useCurriculumTopics } from "../hooks/use-ai-tools"
import { FieldRow, NativeSelect } from "./form-bits"

/** Saves generated questions to the question bank under the subject and a topic; questions the teacher already sees are skipped by the server. */
export function SaveToBankDialog({
  open,
  onOpenChange,
  questions,
  difficulty,
  subjectId,
  topic: initialTopic = "",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  questions: MockQuestion[]
  difficulty: Difficulty
  subjectId: string
  topic?: string
}) {
  const t = useT("aiTools")
  const [topic, setTopic] = useState(initialTopic.trim())
  const { topics: planTopics } = useCurriculumTopics(subjectId)
  const options = [...new Set(planTopics.map((x) => x.topic).filter((x) => x !== ""))]
  const selected = options.length === 0 ? topic : options.includes(topic) ? topic : (options[0] ?? "")
  const save = useMutation({
    mutationFn: () =>
      saveToBank(subjectId, {
        topic: selected.trim(),
        difficulty,
        questions: questions
          .map((q) => ({
            question: q.text.trim().slice(0, 2000),
            answer: (q.options[q.correct[0] ?? 0] ?? "").trim().slice(0, 2000),
            options: q.options
              .map((o) => o.trim())
              .filter((o) => o !== "")
              .slice(0, 10),
            explanation: null,
          }))
          .filter((q) => q.question !== "" && q.answer !== "")
          .slice(0, 100),
      }),
  })
  const done = save.isSuccess
  const close = (next: boolean) => {
    onOpenChange(next)
    if (!next) save.reset()
  }
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={close}
      title={t("saveToBank.title")}
      description={t("saveToBank.desc")}
      footer={
        done ? (
          <>
            <Button type="button" variant="outline" onClick={() => close(false)}>
              {t("saveToBank.close")}
            </Button>
            <Button render={<Link href="/ai-tools/bank/" />}>{t("saveToBank.open")}</Button>
          </>
        ) : (
          <>
            <Button type="button" variant="outline" onClick={() => close(false)}>
              {t("addToTest.cancel")}
            </Button>
            <Button type="button" disabled={save.isPending || topic.trim() === ""} onClick={() => save.mutate()}>
              {t("saveToBank.confirm", { count: questions.length })}
            </Button>
          </>
        )
      }
    >
      {done ? (
        <div className="flex flex-col gap-1">
          <p className="text-success flex items-center gap-2 font-medium">
            <IconCircleCheck className="size-5" aria-hidden />
            {t("saveToBank.done", { topic })}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <FieldRow label={t("form.emisTopic")} htmlFor="stb-topic">
            {options.length > 0 ? (
              <NativeSelect id="stb-topic" value={selected} onChange={(e) => setTopic(e.target.value)}>
                {options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </NativeSelect>
            ) : null}
            {options.length === 0 ? (
              <Input
                id="stb-topic"
                value={topic}
                placeholder={t("form.topicPlaceholder")}
                onChange={(e) => setTopic(e.target.value)}
                className="min-h-11 md:min-h-8"
              />
            ) : null}
          </FieldRow>
          {options.length === 0 ? <p className="text-muted-foreground text-sm">{t("saveToBank.noPlan")}</p> : null}
          {save.isError ? (
            <p role="alert" className="text-destructive text-sm">
              {t("saveToBank.error")}
            </p>
          ) : null}
          <p className="flex items-center gap-2 text-sm">
            {t("form.difficulty")}: <Pill>{t(`difficulty.${difficulty}`)}</Pill>
          </p>
        </div>
      )}
    </ResponsiveDialog>
  )
}
