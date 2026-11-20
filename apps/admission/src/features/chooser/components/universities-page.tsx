"use client"

import { useT } from "@ihsp/i18n"
import { Button, buttonVariants, Icons, Skeleton } from "@ihsp/ui"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Suspense, type ReactNode } from "react"
import { FlowStepper, type FlowStepperItem } from "../../../components/lib/flow-stepper"
import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { AlgorithmFlow } from "../../algorithm/components/algorithm-flow"
import { useAlgorithmDone } from "../../algorithm"
import { BudgetPage } from "../../budget/components/budget-page"
import { ScreenSummary } from "../../assistant/screen-context"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { deriveFlow, FLOW_STEPS, LIST_TARGET, useBudgetViewed, type FlowStep, type FlowStepId } from "../flow"
import { useList } from "../hooks"
import { ListBriefButton } from "./list-brief"
import { MyList } from "./my-list"
import { SearchView } from "./search-view"

/** The foot of an open step: the way on to the next one, closed (with the reason) until this step is done. */
function NextCta({ step, next, onGo }: { step: FlowStep; next: FlowStepId; onGo: (id: FlowStepId) => void }) {
  const t = useT("flow")
  return (
    <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground text-sm">{step.done ? null : t(`hint.${step.id}`, { count: LIST_TARGET })}</p>
      <Button type="button" disabled={!step.done} onClick={() => onGo(next)} className="min-h-11 sm:min-h-9">
        {t("next", { step: t(`steps.${next}.title`) })}
        <Icons.arrowRight aria-hidden />
      </Button>
    </div>
  )
}

/** Step 5: the AI brief on the list, the last stop before the essays. */
function BriefStep() {
  const t = useT("flow")
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm">{t("steps.brief.text")}</p>
      <div className="flex flex-wrap items-center gap-3">
        <ListBriefButton className="min-h-11 md:min-h-9" />
        <Link href="/essays/?tab=colleges" className={buttonVariants({ variant: "outline" })}>
          {t("steps.brief.essays")}
        </Link>
      </div>
    </div>
  )
}

function Flow() {
  const t = useT("flow")
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const quiz = useAlgorithmDone()
  const list = useList()
  const { viewed, markViewed } = useBudgetViewed()
  if (quiz.isLoading || list.isLoading) return <Skeleton className="h-72 w-full" />
  const entries = list.data?.length ?? 0
  const flow = deriveFlow({ quizDone: quiz.done, entries, budgetViewed: viewed }, params.get("step"))

  function go(id: FlowStepId) {
    router.replace(`${pathname}?step=${id}`)
  }

  const summaryOf = (step: FlowStep): ReactNode => {
    if (step.locked) {
      const blocker = step.blockedBy ?? "quiz"
      return t(`locked.${blocker}`, { count: step.missing ?? 1, target: LIST_TARGET })
    }
    if (step.id === "match" || step.id === "list") return t(`steps.${step.id}.summary`, { count: entries })
    return t(`steps.${step.id}.summary`)
  }
  const content: Record<FlowStepId, ReactNode> = {
    quiz: <AlgorithmFlow withContinue={false} onFinished={() => go("match")} />,
    match: <SearchView />,
    list: <MyList />,
    budget: (
      <Suspense>
        <BudgetPage onViewed={markViewed} />
      </Suspense>
    ),
    brief: <BriefStep />,
  }
  const items: FlowStepperItem[] = flow.steps.map((step, index) => {
    const next = FLOW_STEPS[index + 1]
    const status = step.locked ? "locked" : step.done ? "done" : "current"
    return {
      id: step.id,
      number: step.number,
      title: t(`steps.${step.id}.title`),
      summary: summaryOf(step),
      status,
      statusLabel: t(`status.${status}`),
      open: flow.open === step.id,
      content: content[step.id],
      footer: next ? <NextCta step={step} next={next} onGo={go} /> : undefined,
    }
  })
  return <FlowStepper items={items} label={t("label")} onSelect={(id) => go(id as FlowStepId)} />
}

/** `/chooser/`: "Universities and budget" as one straight flow: quiz, pick, my list, budget, brief. */
export function UniversitiesPage() {
  const t = useT("nav")
  return (
    <AdmissionShell>
      <ScreenSummary
        title={t("sections.universities")}
        summary="Universities and budget: quiz, pick (swipe deck or catalog), my list, budget and aid, AI brief of the list."
      />
      <div className={pageClass()}>
        <AppPageHeader icon="search" title={t("sections.universities")} />
        <Suspense>
          <Flow />
        </Suspense>
      </div>
    </AdmissionShell>
  )
}
