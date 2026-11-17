"use client"

import { AppPageHeader, PageSection, pageClass, ProgressRing } from "../../../components/lib/page"
import { ApiError } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Button,
  buttonVariants,
  Icons,
  Pill,
  Progress,
  Reveal,
  Skeleton,
  StateView,
} from "@ihsp/ui"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"
import { AdmissionShell } from "../../shell/components/admission-shell"
import {
  isActive,
  SECTION_KEYS,
  REVIEWS_KEY,
  startReview,
  useReviews,
  type AppReview,
  type ReviewPoint,
  type ReviewSection,
} from "../api"

export function AppReviewPage() {
  return (
    <AdmissionShell>
      <AppReviewPanel />
    </AdmissionShell>
  )
}

/** Run button, progress, the selected report and the version history. */
export function AppReviewPanel() {
  const t = useT("appReview")
  const query = useReviews()
  const queryClient = useQueryClient()
  const [starting, setStarting] = useState(false)
  const [failure, setFailure] = useState<unknown>(null)
  const [selected, setSelected] = useState<string | null>(null)

  async function run() {
    setStarting(true)
    setFailure(null)
    try {
      const review = await startReview()
      queryClient.setQueryData<AppReview[]>(REVIEWS_KEY, (old) => [review, ...(old ?? [])])
      setSelected(null)
    } catch (error) {
      setFailure(error)
    } finally {
      setStarting(false)
    }
  }

  const err = failure instanceof ApiError ? failure : null
  const items = query.data ?? []
  const latest = items[0]
  const busy = starting || isActive(latest)
  const current = items.find((r) => r.id === selected) ?? latest

  let body
  if (query.isPending) {
    body = <Skeleton className="h-40 w-full" />
  } else if (query.isError) {
    body = <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
  } else if (err?.type === "admission/consent_required") {
    body = (
      <StateView
        state="error"
        icon="lock"
        title={t("consentTitle")}
        action={
          <Link href="/settings/#consent" className={buttonVariants()}>
            {t("goConsent")}
          </Link>
        }
      />
    )
  } else if (!current) {
    body = (
      <StateView
        state="empty"
        title={t("emptyTitle")}
        action={
          <Button disabled={busy} onClick={() => void run()}>
            {t("run")}
          </Button>
        }
      />
    )
  } else {
    body = <ReviewView review={current} />
  }

  return (
    <div className={pageClass("narrow")}>
      <AppPageHeader
        icon="badgeCheck"
        title={t("title")}
        actions={
          current ? (
            <Button size="sm" disabled={busy} onClick={() => void run()}>
              <Icons.sparkles />
              {busy ? t("running") : t("runAgain")}
            </Button>
          ) : null
        }
      />
      {err?.type === "common/rate-limited" ? (
        <Alert variant="destructive">
          <AlertDescription>{t("quota")}</AlertDescription>
        </Alert>
      ) : null}
      {err?.type === "admission/conflict" ? (
        <Alert>
          <AlertDescription>{t("conflict")}</AlertDescription>
        </Alert>
      ) : null}
      {err?.type === "ai/access-revoked" ? (
        <Alert variant="destructive">
          <AlertDescription>{t("revoked")}</AlertDescription>
        </Alert>
      ) : null}
      {body}
      <History items={items} current={current} onSelect={setSelected} />
    </div>
  )
}

/** Version buttons, shown once there is more than one review. */
export function History({
  items,
  current,
  onSelect,
}: {
  items: AppReview[]
  current: AppReview | undefined
  onSelect: (id: string) => void
}) {
  const t = useT("appReview")
  if (items.length < 2) return null
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-medium">{t("history")}</h2>
      <ul className="flex flex-wrap gap-2">
        {items.map((review) => (
          <li key={review.id}>
            <Button
              size="sm"
              variant={review.id === current?.id ? "secondary" : "outline"}
              aria-pressed={review.id === current?.id}
              onClick={() => onSelect(review.id)}
            >
              {t("version", { n: String(review.version) })}
              <span className="text-muted-foreground text-xs">{t(`status.${review.status}`)}</span>
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}
export function ReviewView({ review }: { review: AppReview }) {
  const t = useT("appReview")
  if (isActive(review)) {
    const live = SECTION_KEYS.map(
      (key): ReviewSection =>
        review.sections.find((s) => s.key === key) ?? {
          key,
          status: "pending",
          score: null,
          summary: "",
          findings: [],
          next_actions: [],
        },
    )
    const finished = live.filter((s) => s.status !== "pending" && s.status !== "running").length
    const total = SECTION_KEYS.length
    return (
      <div className="flex flex-col gap-3">
        <section role="status" className="flex flex-col gap-3 rounded-lg border p-4">
          <p className="text-sm font-medium">{t(`status.${review.status}`)}</p>
          <Progress value={finished ? Math.round((finished / total) * 100) : null} aria-label={t("progress")} />
          <p className="text-muted-foreground text-sm">
            {t("progressCount", { done: String(finished), total: String(total) })}
          </p>
          <p className="text-muted-foreground text-sm">{t("progressHint")}</p>
        </section>
        {live.map((section) => (
          <LiveSection key={section.key} section={section} name={t(`section.${section.key}`)} />
        ))}
      </div>
    )
  }
  if (review.status === "failed" || !review.report) {
    const code = review.error_code ?? "internal"
    const known = ["consent_required", "sections_failed", "ai_access_revoked", "kick_failed"].includes(code)
    return <StateView state="error" title={t(`errors.${known ? code : "internal"}`)} />
  }
  const report = review.report
  const sections = new Map(review.sections.map((s) => [s.key, s]))
  return (
    <Reveal>
      <div className="flex flex-col gap-6">
        <section className="bg-card rounded-card flex flex-col items-center gap-5 border p-6 sm:flex-row">
          <ProgressRing percent={report.overall_score} label={t("outOf100")} />
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground text-sm">{t("outOf100")}</span>
              {report.fallback ? <Pill>{t("fallback")}</Pill> : null}
            </div>
            <p className="text-lg font-semibold">{report.headline}</p>
            <p className="text-sm">
              <span className="font-medium">{t("spike", { score: String(report.spike.score) })}</span>{" "}
              {report.spike.comment}
            </p>
          </div>
        </section>
        {report.injection_suspected ? (
          <Alert>
            <AlertDescription>{t("injection")}</AlertDescription>
          </Alert>
        ) : null}
        <Points title={t("strengths")} points={report.strengths} />
        <Points title={t("risks")} points={report.risks} />
        {report.next_actions.length > 0 ? (
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium">{t("nextActions")}</h2>
            <ol className="flex flex-col gap-2">
              {report.next_actions.map((action, i) => (
                <li key={i} className="flex flex-col gap-1 rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{action.title}</span>
                    <Pill>{t(`priority.${action.priority}`)}</Pill>
                  </div>
                  <p className="text-muted-foreground text-sm">{action.why}</p>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
        <PageSection title={t("sections")} className="gap-3">
          {report.section_scores.map((score) => (
            <SectionCard
              key={score.section}
              score={score.score}
              comment={score.comment}
              section={sections.get(score.section)}
              name={t(`section.${score.section}`)}
            />
          ))}
        </PageSection>
      </div>
    </Reveal>
  )
}

/** One section while the review runs: a shimmer until it finishes, then it fades in. */
function LiveSection({ section, name }: { section: ReviewSection; name: string }) {
  const t = useT("appReview")
  if (section.status === "pending" || section.status === "running") {
    return (
      <div
        data-testid={`section-${section.key}`}
        data-state="loading"
        aria-busy="true"
        className="flex flex-col gap-2 rounded-lg border p-3"
      >
        <span className="font-medium">{name}</span>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <span className="sr-only">{t(`sectionStatus.${section.status}`)}</span>
      </div>
    )
  }
  return (
    <Reveal>
      <div
        data-testid={`section-${section.key}`}
        data-state="ready"
        className="flex flex-col gap-2 rounded-lg border p-3"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium">{name}</span>
          {section.status === "done" && section.score != null ? (
            <span className="tabular-nums">{t("score", { score: String(section.score) })}</span>
          ) : (
            <Pill>{t(`sectionStatus.${section.status}`)}</Pill>
          )}
        </div>
        {section.summary ? <p className="text-sm">{section.summary}</p> : null}
        {section.findings.length > 0 ? (
          <ul className="flex flex-col gap-1 text-sm">
            {section.findings.map((f, i) => (
              <li key={i}>
                <Pill>{t(`kind.${f.kind}`)}</Pill> {f.text}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Reveal>
  )
}

function Points({ title, points }: { title: string; points: ReviewPoint[] }) {
  const t = useT("appReview")
  if (points.length === 0) return null
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-medium">{title}</h2>
      <ul className="flex flex-col gap-2">
        {points.map((point, i) => (
          <li key={i} className="text-sm">
            <Pill>{t(`section.${point.section}`)}</Pill> {point.text}
          </li>
        ))}
      </ul>
    </section>
  )
}

function SectionCard({
  name,
  score,
  comment,
  section,
}: {
  name: string
  score: number
  comment: string
  section: ReviewSection | undefined
}) {
  const t = useT("appReview")
  const status = section?.status ?? "skipped"
  return (
    <details className="group rounded-lg border p-3">
      <summary className="flex cursor-pointer items-center justify-between gap-2">
        <span className="font-medium">{name}</span>
        <span className="flex items-center gap-2">
          {status !== "done" ? <Pill>{t(`sectionStatus.${status}`)}</Pill> : null}
          <span className="tabular-nums">{t("score", { score: String(score) })}</span>
        </span>
      </summary>
      <div className="mt-2 flex flex-col gap-2 text-sm">
        {comment ? <p>{comment}</p> : null}
        {section?.summary ? <p className="text-muted-foreground">{section.summary}</p> : null}
        {section && section.findings.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {section.findings.map((f, i) => (
              <li key={i}>
                <Pill>{t(`kind.${f.kind}`)}</Pill> {f.text}
              </li>
            ))}
          </ul>
        ) : null}
        {section && section.next_actions.length > 0 ? (
          <ul className="list-disc pl-5">
            {section.next_actions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </details>
  )
}
