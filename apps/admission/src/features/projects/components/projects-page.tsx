"use client"

import { useErrorMessage, useLocale, useT } from "@ihsp/i18n"
import { Button, Icons, Skeleton, StateView } from "@ihsp/ui"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { QueryError } from "../../shell/components/query-error"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { emptyBrief, useGenerateProjects, useProjectRun, useProjectRuns, type Brief, type ProjectRun } from "../api"
import { BriefForm } from "./brief-form"
import { ProjectCard } from "./project-card"

/** Shown while the model searches: a run takes 20 to 40 seconds. */
function Running() {
  const t = useT("projects")
  return (
    <div role="status" aria-live="polite" className="bg-card flex flex-col gap-3 rounded-card border p-6">
      <div className="flex items-center gap-2">
        <Icons.sparkles aria-hidden className="text-primary size-5 animate-pulse" />
        <span className="font-medium">{t("running.title")}</span>
      </div>
      <p className="text-muted-foreground text-sm">{t("running.text")}</p>
      <Skeleton className="h-24 w-full" />
    </div>
  )
}

function Results({ run }: { run: ProjectRun }) {
  const t = useT("projects")
  return (
    <section className="flex flex-col gap-3" aria-label={t("results.title")}>
      <h2 className="text-lg font-semibold">{t("results.count", { count: run.projects.length })}</h2>
      {!run.search_used && <p className="text-muted-foreground text-sm">{t("results.noSearch")}</p>}
      <ul className="grid gap-4 lg:grid-cols-2">
        {run.projects.map((p) => (
          <ProjectCard key={p.key} project={p} />
        ))}
      </ul>
    </section>
  )
}

export function ProjectsBody() {
  const t = useT("projects")
  const locale = useLocale()
  const errorMessage = useErrorMessage()
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const runParam = params.get("run")
  const runs = useProjectRuns()
  const selected = useProjectRun(runParam)
  const generate = useGenerateProjects()
  const [formOpen, setFormOpen] = useState(false)

  const selectRun = (id: string | null) => router.replace(id ? `${pathname}?run=${encodeURIComponent(id)}` : pathname)
  const when = (iso: string) => new Date(iso).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" })

  function submit(brief: Brief) {
    generate.mutate(brief, {
      onSuccess: (run) => {
        setFormOpen(false)
        selectRun(run.id)
      },
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  const latest = runs.data?.latest ?? null
  const shown: ProjectRun | null = runParam ? (selected.data ?? null) : latest
  const history = runs.data?.history ?? []
  const showForm = formOpen || (runs.isSuccess && !latest && !runParam)

  let body
  if (generate.isPending) body = <Running />
  else if (runs.isPending || (runParam && selected.isPending)) body = <Skeleton className="h-40 w-full" />
  else if (runs.isError) body = <QueryError error={runs.error} onRetry={() => void runs.refetch()} />
  else if (runParam && selected.isError)
    body = <QueryError error={selected.error} onRetry={() => void selected.refetch()} />
  else if (showForm)
    body = <BriefForm initial={shown?.brief ?? emptyBrief} pending={generate.isPending} onSubmit={submit} />
  else if (shown) body = <Results run={shown} />
  else body = <StateView state="empty" title={t("emptyTitle")} description={t("emptyText")} />

  return (
    <div className={pageClass()}>
      <AppPageHeader
        icon="sparkles"
        title={t("title")}
        actions={
          !generate.isPending && !showForm && latest ? (
            <Button type="button" size="sm" className="min-h-11" onClick={() => setFormOpen(true)}>
              {t("newRun")}
            </Button>
          ) : undefined
        }
      />
      <p className="text-muted-foreground text-sm">{t("intro")}</p>
      <Link href="/opportunities/" className="text-primary min-h-11 self-start text-sm hover:underline">
        {t("back")}
      </Link>
      {history.length > 1 && (
        <nav aria-label={t("history.title")} className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm">{t("history.title")}</span>
          {history.map((h) => {
            const active = runParam ? runParam === h.id : latest?.id === h.id
            return (
              <Button
                key={h.id}
                type="button"
                size="sm"
                className="min-h-11"
                variant={active ? "default" : "outline"}
                aria-pressed={active}
                onClick={() => {
                  setFormOpen(false)
                  selectRun(h.id)
                }}
              >
                {when(h.created_at)} · {h.count}
              </Button>
            )
          })}
        </nav>
      )}
      {body}
    </div>
  )
}

export function ProjectsPage() {
  return (
    <AdmissionShell>
      <ProjectsBody />
    </AdmissionShell>
  )
}
