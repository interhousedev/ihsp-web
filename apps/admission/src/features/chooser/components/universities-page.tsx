"use client"

import { useT } from "@ihsp/i18n"
import { Skeleton } from "@ihsp/ui"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { useAlgorithmDone } from "../../algorithm"
import { AlgorithmFlow } from "../../algorithm/components/algorithm-flow"
import { ScreenSummary } from "../../assistant/screen-context"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { deriveStages, type StageId } from "../flow"
import { useList } from "../hooks"
import { BriefRail } from "./brief-rail"
import { UniListStage } from "./list-stage"
import { SearchView } from "./search-view"
import { StageRail } from "./stage-rail"

function Stages() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const quiz = useAlgorithmDone()
  const list = useList()
  if (quiz.isLoading || list.isLoading) return <Skeleton className="h-72 w-full" />
  const flow = deriveStages({ quizDone: quiz.done, entries: list.data?.length ?? 0 }, params.get("step"))

  function go(id: StageId) {
    router.replace(`${pathname}?step=${id}`)
  }

  return (
    <>
      <StageRail stages={flow.stages} open={flow.open} onSelect={go} />
      {flow.open === "quiz" ? <AlgorithmFlow withContinue={false} onFinished={() => go("match")} /> : null}
      {flow.open === "match" ? <SearchView /> : null}
      {flow.open === "list" ? (
        <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <UniListStage />
          <BriefRail />
        </div>
      ) : null}
    </>
  )
}

/** `/chooser/`: survey, matching and the list as three stages on a thin rail; linear until the first university, then free. */
export function UniversitiesPage() {
  const t = useT("nav")
  return (
    <AdmissionShell>
      <ScreenSummary
        title={t("sections.universities")}
        summary="Universities: survey, matching (swipe deck or catalog, list tray), and the list with fit, cost after aid, budget gap and AI brief."
      />
      <div className={pageClass()}>
        <h1 className="sr-only md:hidden">{t("sections.universities")}</h1>
        <div className="max-md:hidden" aria-hidden={undefined}>
          <AppPageHeader icon="search" title={t("sections.universities")} />
        </div>
        <Suspense>
          <Stages />
        </Suspense>
      </div>
    </AdmissionShell>
  )
}
