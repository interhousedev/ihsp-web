"use client"

import { AppPageHeader, pageClass, StatCard, StatGrid } from "../../../components/lib/page"
import { formatDate, useErrorMessage, useLocale, useT } from "@ihsp/i18n"
import {
  Badge,
  Button,
  buttonVariants,
  Card,
  CardContent,
  ConfirmDialog,
  Icons,
  Pill,
  Progress,
  StateView,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@ihsp/ui"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { useScreenContext } from "../../assistant/screen-context"
import { downloadDocument } from "../../documents/api"
import { AdmissionShell } from "../../shell/components/admission-shell"
import {
  scoreName,
  useDeleteScore,
  useScoreCatalog,
  useScores,
  useVerifyScore,
  type ScoreEntry,
  type ScoreOverview,
  type ScoreSection,
  type ScoreStatus,
  type ScoreSummary,
  type ScoreTest,
} from "../api"
import { ScoreDialog } from "./score-dialog"

const STATUS_VARIANT = { planned: "neutral", registered: "info", taken: "warning", score_received: "success" } as const

function Bar({ section, value }: { section: ScoreSection; value: number | string | undefined }) {
  const locale = useLocale()
  const name = scoreName(section.names, locale)
  if (value === undefined) return null
  if ((section.choices?.length ?? 0) > 0 || typeof value === "string") {
    return (
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{name}</span>
        <span className="font-medium">{value}</span>
      </div>
    )
  }
  const share = section.max > section.min ? ((value - section.min) / (section.max - section.min)) * 100 : 0
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{name}</span>
        <span className="font-medium">{value}</span>
      </div>
      <Progress value={Math.max(0, Math.min(100, share))} aria-label={name} />
    </div>
  )
}

function ScoreCard({
  entry,
  test,
  summary,
  isOwner,
  canVerify,
  onEdit,
}: {
  entry: ScoreEntry
  test: ScoreTest
  summary: ScoreSummary | undefined
  isOwner: boolean
  canVerify: boolean
  onEdit: () => void
}) {
  const t = useT("testScores")
  const locale = useLocale()
  const errorMessage = useErrorMessage()
  const verify = useVerifyScore()
  const remove = useDeleteScore()
  const [confirming, setConfirming] = useState(false)
  const isBest = summary?.best_entry_id === entry.id
  const superscore = test.superscore ? summary?.superscore_total : null

  async function run(action: Promise<unknown>) {
    try {
      await action
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  async function openCertificate(id: string) {
    try {
      window.open((await downloadDocument(id)).url, "_blank", "noopener")
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold">
              {scoreName(test.names, locale)}
              {entry.label ? ` · ${entry.label}` : ""}
              {entry.level ? ` · ${entry.level}` : ""}
            </h3>
            {entry.test_date ? <p className="text-muted-foreground text-xs">{formatDate(entry.test_date)}</p> : null}
            {entry.registration_deadline ? (
              <p className="text-muted-foreground text-xs">
                {t("registrationDeadline")}: {formatDate(entry.registration_deadline)}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-1">
            <Badge variant={STATUS_VARIANT[entry.status as ScoreStatus]}>{t(`statusValue.${entry.status}`)}</Badge>
            {isBest && summary?.best_total != null ? <Badge variant="success">{t("best")}</Badge> : null}
            {entry.verified_at ? <Badge variant="info">{t("verified")}</Badge> : null}
            {entry.source === "certificate" ? <Badge variant="secondary">{t("fromCertificate")}</Badge> : null}
          </div>
        </div>
        {test.sections.map((section) => (
          <Bar key={section.key} section={section} value={entry.sections[section.key]} />
        ))}
        {entry.total != null && test.total ? <Bar section={test.total} value={entry.total} /> : null}
        {superscore != null ? (
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="secondary">{t("superscore")}</Badge>
            <span className="font-semibold">{superscore}</span>
          </div>
        ) : null}
        {entry.send_note ? <p className="text-muted-foreground text-sm">{entry.send_note}</p> : null}
        <div className="flex flex-wrap gap-2">
          {entry.certificate_document_id ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11 md:min-h-9"
              onClick={() => void openCertificate(entry.certificate_document_id!)}
            >
              <Icons.certificates aria-hidden />
              {t("viewCertificate")}
            </Button>
          ) : null}
          {entry.verification_url ? (
            <a
              className={buttonVariants({ variant: "outline", size: "sm", className: "min-h-11 md:min-h-9" })}
              href={entry.verification_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("openLink")}
            </a>
          ) : null}
          {canVerify && entry.status === "score_received" ? (
            <Button
              type="button"
              size="sm"
              className="min-h-11 md:min-h-9"
              variant={entry.verified_at ? "ghost" : "default"}
              disabled={verify.isPending}
              onClick={() => void run(verify.mutateAsync({ id: entry.id, verified: !entry.verified_at }))}
            >
              <Icons.check aria-hidden />
              {entry.verified_at ? t("removeVerification") : t("markVerified")}
            </Button>
          ) : null}
          {isOwner && entry.source !== "certificate" ? (
            <>
              <Button type="button" variant="ghost" size="sm" className="min-h-11 md:min-h-9" onClick={onEdit}>
                <Icons.edit aria-hidden />
                {t("edit")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-h-11 md:min-h-9"
                disabled={remove.isPending}
                onClick={() => setConfirming(true)}
              >
                <Icons.trash aria-hidden />
                {t("delete")}
              </Button>
            </>
          ) : null}
        </div>
      </CardContent>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t("delete")}
        description={t("deleteConfirm")}
        confirmLabel={t("delete")}
        destructive
        loading={remove.isPending}
        onConfirm={async () => {
          await run(remove.mutateAsync(entry.id))
          setConfirming(false)
        }}
      />
    </Card>
  )
}

const UPCOMING: readonly string[] = ["planned", "registered"]
type Tab = "results" | "upcoming"
const TABS: Tab[] = ["results", "upcoming"]

function Cards({
  overview,
  entries,
  tests,
  onEdit,
}: {
  overview: ScoreOverview
  entries: ScoreEntry[]
  tests: ScoreTest[]
  onEdit: (entry: ScoreEntry) => void
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {entries.map((entry) => {
        const test = tests.find((item) => item.id === entry.test_id)
        if (!test) return null
        return (
          <ScoreCard
            key={entry.id}
            entry={entry}
            test={test}
            summary={overview.summaries.find((item) => item.test_id === entry.test_id)}
            isOwner={overview.is_owner}
            canVerify={overview.can_verify}
            onEdit={() => onEdit(entry)}
          />
        )
      })}
    </div>
  )
}

/** Standard certificates of the platform no catalog test matches: read-only, edited in the profile. */
function ExamCertificates({ exams }: { exams: ScoreOverview["exams"] }) {
  const t = useT("testScores")
  const locale = useLocale()
  if (exams.length === 0) return null
  return (
    <section aria-label={t("examsTitle")} className="flex flex-col gap-2">
      <div>
        <h2 className="text-sm font-semibold">{t("examsTitle")}</h2>
        <p className="text-muted-foreground text-xs">{t("examsHint")}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {exams.map((exam) => (
          <Card key={exam.entry_id}>
            <CardContent className="flex flex-col gap-1">
              <h3 className="font-semibold">{scoreName(exam.name, locale)}</h3>
              {exam.issued_at ? <p className="text-muted-foreground text-xs">{formatDate(exam.issued_at)}</p> : null}
              <p className="text-sm">
                {Object.entries(exam.values)
                  .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
                  .join(" · ")}
              </p>
              <Badge variant="secondary" className="self-start">
                {t("fromCertificate")}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

/** Desktop aside: the best total per test. */
function BestScores({ overview, tests }: { overview: ScoreOverview; tests: ScoreTest[] }) {
  const t = useT("testScores")
  const locale = useLocale()
  const rows = overview.summaries.filter((s) => s.best_total != null && tests.some((x) => x.id === s.test_id))
  return (
    <aside aria-label={t("summaryTitle")} className="hidden xl:flex xl:flex-col xl:gap-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Icons.certificates aria-hidden className="text-success size-4" />
        {t("summaryTitle")}
      </h2>
      {rows.length === 0 ? (
        <p className="text-muted-foreground border-hairline rounded-card border border-dashed p-4 text-sm">
          {t("summaryEmpty")}
        </p>
      ) : (
        <StatGrid className="grid-cols-1 lg:grid-cols-1">
          {rows.map((row) => (
            <StatCard
              key={row.test_id}
              label={scoreName(tests.find((x) => x.id === row.test_id)!.names, locale)}
              value={row.best_total}
              icon="certificates"
            />
          ))}
        </StatGrid>
      )}
    </aside>
  )
}

/** Test scores and certificates; `studentId` shows a student's entries to staff. */
export function TestsBody({ studentId, staffEmpty }: { studentId?: string; staffEmpty?: string }) {
  const t = useT("testScores")
  const catalog = useScoreCatalog()
  const scores = useScores(studentId)
  const [dialog, setDialog] = useState<{ entry?: ScoreEntry } | null>(null)
  const [chosen, setChosen] = useState<Tab | null>(null)
  const tests = catalog.data?.items ?? []
  const overview = scores.data
  useScreenContext({
    title: t("title"),
    summary: `Test results: ${overview?.entries.length ?? 0}`,
  })
  const failed = catalog.isError ? catalog : scores.isError ? scores : null
  const upcoming = overview?.entries.filter((e) => UPCOMING.includes(e.status)) ?? []
  const results = overview?.entries.filter((e) => !UPCOMING.includes(e.status)) ?? []
  const tab: Tab = chosen ?? (results.length === 0 && upcoming.length > 0 ? "upcoming" : "results")
  const shown = tab === "upcoming" ? upcoming : results
  const counts = { results: results.length, upcoming: upcoming.length }
  return (
    <div className="flex flex-col gap-6">
      {studentId ? null : (
        <AppPageHeader
          icon="certificates"
          title={t("title")}
          actions={
            overview?.is_owner ? (
              <Button type="button" onClick={() => setDialog({})}>
                <Icons.add aria-hidden />
                {t("add")}
              </Button>
            ) : null
          }
        />
      )}
      {studentId ? null : (
        <Link
          href="/deadlines/"
          className={buttonVariants({ variant: "outline", className: "min-h-11 self-start md:min-h-9" })}
        >
          <Icons.calendarEvent aria-hidden />
          {t("openPrepCalendar")}
        </Link>
      )}
      {failed ? (
        <StateView state="error" error={failed.error} onRetry={() => void failed.refetch()} />
      ) : !overview || catalog.isPending ? (
        <StateView state="loading" rows={3} />
      ) : overview.entries.length === 0 && overview.exams.length === 0 ? (
        <StateView
          state="empty"
          icon={<Icons.certificates aria-hidden />}
          title={staffEmpty ?? t("emptyTitle")}
          description={staffEmpty ? undefined : t("emptyText")}
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex min-w-0 flex-col gap-4">
            <Tabs value={tab} onValueChange={(value) => setChosen(TABS.find((x) => x === value) ?? "results")}>
              <TabsList variant="line">
                {TABS.map((x) => (
                  <TabsTrigger key={x} value={x} className="gap-2">
                    {t(`tabs.${x}`)}
                    <Pill tone={x === "results" ? "success" : "primary"} className="h-5 px-1.5 text-xs">
                      {counts[x]}
                    </Pill>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            {tab === "results" ? <ExamCertificates exams={overview.exams} /> : null}
            {shown.length === 0 && !(tab === "results" && overview.exams.length > 0) ? (
              <StateView
                state="empty"
                icon={tab === "upcoming" ? <Icons.calendar aria-hidden /> : <Icons.exams aria-hidden />}
                title={t(tab === "upcoming" ? "emptyUpcomingTitle" : "emptyResultsTitle")}
                description={t(tab === "upcoming" ? "emptyUpcomingText" : "emptyResultsText")}
              />
            ) : (
              <Cards overview={overview} entries={shown} tests={tests} onEdit={(entry) => setDialog({ entry })} />
            )}
          </div>
          <BestScores overview={overview} tests={tests} />
        </div>
      )}
      {dialog ? (
        <ScoreDialog
          key={dialog.entry?.id ?? "new"}
          open
          onOpenChange={(open) => !open && setDialog(null)}
          tests={tests}
          entry={dialog.entry}
        />
      ) : null}
    </div>
  )
}

export function TestsPage() {
  return (
    <AdmissionShell>
      <div className={pageClass()}>
        <TestsBody />
      </div>
    </AdmissionShell>
  )
}
