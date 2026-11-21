"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, useIsMobile } from "@ihsp/ui"
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
  const mobile = useIsMobile()
  return (
    <Sheet>
      <SheetTrigger render={<Button type="button" variant="outline" />}>
        <Icons.sparkles aria-hidden />
        {t("ask.open")}
      </SheetTrigger>
      <SheetContent side={mobile ? "bottom" : "right"} className="max-h-[85dvh] overflow-y-auto p-4 md:max-h-none md:w-[28rem]">
        <SheetHeader>
          <SheetTitle>{t("ask.title", { name })}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4">
          <AiSummary institutionId={institutionId} />
          <Questions institutionId={institutionId} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
