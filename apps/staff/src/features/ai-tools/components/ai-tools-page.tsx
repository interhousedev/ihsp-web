"use client"

import { useT } from "@ihsp/i18n"
import {
  Button,
  IconBooks,
  IconChecklist,
  IconClipboardCheck,
  IconFileText,
  IconSparkles,
  IconVideo,
  PageContainer,
} from "@ihsp/ui"
import Link from "next/link"
import { useJobs } from "../hooks/use-ai-tools"
import { TOOL_IDS } from "../mock-data"
import { JobCard } from "./job-card"

const TOOL_ICON = {
  questions: IconChecklist,
  handout: IconFileText,
  workCheck: IconClipboardCheck,
  lessonPlan: IconSparkles,
} as const

const CARD =
  "bg-card hover:bg-muted/50 focus-visible:ring-ring ring-foreground/10 flex h-full items-center gap-3 rounded-card p-3 text-start ring-1 transition-colors outline-none focus-visible:ring-2 sm:min-h-32 sm:flex-col sm:items-start sm:gap-2 sm:p-4"

function HubCard({ href, icon: Icon, name, desc }: { href: string; icon: typeof IconSparkles; name: string; desc: string }) {
  return (
    <li>
      <Link href={href} className={CARD}>
        <span className="bg-primary/10 text-primary grid size-10 shrink-0 place-items-center rounded-full">
          <Icon className="size-5" aria-hidden />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="font-medium">{name}</span>
          <span className="text-muted-foreground text-sm">{desc}</span>
        </span>
      </Link>
    </li>
  )
}

/** `/ai-tools/`: the teacher tools in one grid and recent media jobs; jobs that run or failed come first. */
export function AiToolsPage() {
  const t = useT("aiTools")
  const { jobs, retry, retrying } = useJobs()
  const attention = jobs.some((j) => j.status !== "done")
  return (
    <PageContainer
      title={t("title")}
      className="pb-28 md:pb-6"
      actions={
        <Button render={<Link href="/ai-tools/bank/" />} variant="outline">
          <IconBooks aria-hidden />
          {t("bank.title")}
        </Button>
      }
    >
      <p className="text-muted-foreground max-w-2xl text-sm">{t("subtitle")}</p>
      <div className="flex flex-col gap-6">
        <ul className={`grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 ${attention ? "order-2" : ""}`}>
          {TOOL_IDS.map((id) => (
            <HubCard key={id} href={`/ai-tools/tool/?id=${id}`} icon={TOOL_ICON[id]} name={t(`tools.${id}.name`)} desc={t(`tools.${id}.desc`)} />
          ))}
          <HubCard href="/ai-tools/studio/" icon={IconVideo} name={t("studio.title")} desc={t("studio.desc")} />
        </ul>
        <section className={`flex flex-col gap-3 ${attention ? "order-1" : ""}`}>
          <h2 className="text-lg font-semibold">{t("sections.jobs")}</h2>
          {jobs.length === 0 ? <p className="text-muted-foreground text-sm">{t("sections.jobsEmpty")}</p> : null}
          <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} onRetry={retry} retrying={retrying} />
            ))}
          </ul>
        </section>
      </div>
    </PageContainer>
  )
}
