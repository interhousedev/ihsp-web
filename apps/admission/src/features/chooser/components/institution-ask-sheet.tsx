"use client"

import { useT } from "@ihsp/i18n"
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Icons } from "@ihsp/ui"
import { useUniSuggestions } from "../hooks"
import { AiSummary } from "./ai-summary"

function Questions({ institutionId }: { institutionId: string }) {
  const t = useT("chooser")
  const questions = useUniSuggestions(institutionId).data?.questions ?? []
  if (questions.length === 0) return null
  return (
    <section className="flex flex-col gap-2" aria-label={t("ask.questions")}>
      <h3 className="text-sm font-semibold">{t("ask.questions")}</h3>
      <ul data-testid="ask-questions" className="text-muted-foreground flex list-disc flex-col gap-1.5 ps-5 text-sm">
        {questions.map((question) => (
          <li key={question}>{question}</li>
        ))}
      </ul>
    </section>
  )
}

/** «Спросить ИИ»: the summary of the recorded facts and the questions worth asking, in a side sheet (a bottom one on phones). */
export function InstitutionAskSheet({ institutionId, name }: { institutionId: string; name: string }) {
  const t = useT("chooser")
  return (
    <Dialog>
      <DialogTrigger render={<Button type="button" variant="outline" />}>
        <Icons.sparkles aria-hidden />
        {t("ask.open")}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("ask.title", { name })}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <AiSummary institutionId={institutionId} />
          <Questions institutionId={institutionId} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
