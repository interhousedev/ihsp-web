"use client"

import { BackLink } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Button, PageContainer, Pill, StateView } from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import {
  deleteBankQuestion,
  editBankQuestion,
  listBankQuestions,
  setQuestionVisibility,
  type BankQuestion,
  type Difficulty,
  type Visibility,
} from "../api"
import { useBankTopics } from "../hooks/use-ai-tools"
import { NativeSelect, useDefaultSubject } from "./form-bits"
import { useSubjects } from "../hooks/use-ai-tools"

const DIFF_TONE = { easy: "success", medium: "warning", hard: "danger" } as const
const PAGE = 20

/**
 * `/ai-tools/bank/`: the question bank of a subject by EMIS topic. Questions come from the shared bank; each one is
 * visible to its author only or to every teacher of the subject. New questions enter the bank from the test generator.
 */
export function BankPage() {
  const t = useT("aiTools")
  const client = useQueryClient()
  const { subjects } = useSubjects()
  const defaultSubject = useDefaultSubject()
  const [subjectChoice, setSubjectChoice] = useState("")
  const subjectId = subjectChoice || defaultSubject
  const [topic, setTopic] = useState("")
  const { topics } = useBankTopics(subjectId)
  const [limit, setLimit] = useState(PAGE)
  const [editing, setEditing] = useState<BankQuestion | null>(null)
  const list = useQuery({
    queryKey: ["staff", "question-bank", subjectId, "list", topic, limit],
    queryFn: () => listBankQuestions(subjectId, { topic: topic || undefined, limit, offset: 0 }),
    enabled: subjectId !== "",
    placeholderData: (prev) => prev,
  })
  const refresh = () => client.invalidateQueries({ queryKey: ["staff", "question-bank", subjectId] })
  const remove = useMutation({ mutationFn: deleteBankQuestion, onSuccess: refresh })
  const save = useMutation({
    mutationFn: (q: BankQuestion) =>
      editBankQuestion(q.id, {
        question: q.question,
        answer: q.answer,
        options: q.options,
        explanation: q.explanation,
        difficulty: q.difficulty,
      }),
    onSuccess: () => {
      setEditing(null)
      return refresh()
    },
  })
  const share = useMutation({
    mutationFn: (v: { id: string; visibility: Visibility }) => setQuestionVisibility(v.id, v.visibility),
    onSuccess: () => client.invalidateQueries({ queryKey: ["staff", "question-bank", subjectId] }),
  })
  const questions = list.data?.items ?? []
  const total = list.data?.total ?? 0
  return (
    <PageContainer title={t("bank.title")} className="pb-28 md:pb-6">
      <BackLink href="/ai-tools/" label={t("title")} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <NativeSelect
          aria-label={t("form.subject")}
          value={subjectId}
          onChange={(e) => {
            setSubjectChoice(e.target.value)
            setTopic("")
            setLimit(PAGE)
          }}
        >
          {subjects.map((s) => (
            <option key={s.subject_id} value={s.subject_id}>
              {s.name}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label={t("form.emisTopic")}
          value={topic}
          onChange={(e) => {
            setTopic(e.target.value)
            setLimit(PAGE)
          }}
        >
          <option value="">{t("bank.allTopics")}</option>
          {topics.map((x) => (
            <option key={x.topic} value={x.topic}>
              {x.topic} ({x.count})
            </option>
          ))}
        </NativeSelect>
      </div>
      {list.isPending ? <StateView state="loading" /> : null}
      {!list.isPending && questions.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("bank.empty")}</p>
      ) : null}
      <ul className="flex flex-col gap-3">
        {questions.map((q) => (
          <li key={q.id} className="bg-card ring-foreground/10 flex flex-col gap-2 rounded-card p-4 ring-1">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={DIFF_TONE[q.difficulty as Difficulty]}>{t(`difficulty.${q.difficulty}`)}</Pill>
              <Pill>{q.topic}</Pill>
              {q.origin === "ai" ? <Pill tone="primary">{t("bank.originAi")}</Pill> : null}
            </div>
            {editing?.id === q.id ? (
              <div className="flex flex-col gap-2">
                <textarea
                  aria-label={t("bank.questionText")}
                  className="border-input min-h-20 rounded-md border bg-transparent p-2 text-sm"
                  value={editing.question}
                  onChange={(e) => setEditing({ ...editing, question: e.target.value })}
                />
                <textarea
                  aria-label={t("bank.answerText")}
                  className="border-input min-h-16 rounded-md border bg-transparent p-2 text-sm"
                  value={editing.answer}
                  onChange={(e) => setEditing({ ...editing, answer: e.target.value })}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={save.isPending || !editing.question.trim() || !editing.answer.trim()}
                    onClick={() => save.mutate(editing)}
                  >
                    {t("bank.save")}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setEditing(null)}>
                    {t("bank.cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="font-medium break-words">{q.question}</p>
                <p className="text-muted-foreground text-sm break-words">{q.answer}</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={share.isPending}
                    onClick={() =>
                      share.mutate({ id: q.id, visibility: q.visibility === "subject" ? "teacher" : "subject" })
                    }
                  >
                    {q.visibility === "subject" ? t("bank.sharedWithSubject") : t("bank.onlyMine")}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditing(q)}>
                    {t("bank.edit")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={remove.isPending}
                    onClick={() => window.confirm(t("bank.deleteTitle")) && remove.mutate(q.id)}
                  >
                    {t("bank.delete")}
                  </Button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
      {questions.length < total ? (
        <Button type="button" variant="outline" className="self-center" onClick={() => setLimit(limit + PAGE)}>
          {t("bank.more")}
        </Button>
      ) : null}
    </PageContainer>
  )
}
