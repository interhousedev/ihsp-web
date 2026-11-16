"use client"

import { ApiError } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Button,
  buttonVariants,
  GradeChip,
  Icons,
  PageHeader,
  Pill,
  Reveal,
  Skeleton,
  StateView,
} from "@ihsp/ui"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { ALIGNMENT_KEY, createAlignment, useAlignment, type Alignment } from "../api"

export function AlignmentPage() {
  const t = useT("alignment")
  const query = useAlignment()
  const queryClient = useQueryClient()
  const [running, setRunning] = useState(false)
  const [failure, setFailure] = useState<unknown>(null)

  async function refresh() {
    setRunning(true)
    setFailure(null)
    try {
      queryClient.setQueryData(ALIGNMENT_KEY, await createAlignment())
    } catch (error) {
      setFailure(error)
    } finally {
      setRunning(false)
    }
  }

  const err = failure instanceof ApiError ? failure : null
  const report = query.data
  let body
  if (query.isPending) {
    body = <Skeleton className="h-40 w-full" />
  } else if (query.isError) {
    body = <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
  } else if (err?.type === "admission/words_not_set") {
    body = (
      <StateView
        state="empty"
        title={t("noWordsTitle")}
        action={
          <Link href="/words/" className={buttonVariants()}>
            {t("goWords")}
          </Link>
        }
      />
    )
  } else if (err?.type === "admission/consent_required") {
    body = (
      <StateView
        state="error"
        icon="lock"
        title={t("consentTitle")}
        action={
          <Link href="/consent/" className={buttonVariants()}>
            {t("goConsent")}
          </Link>
        }
      />
    )
  } else if (!report) {
    body = (
      <StateView
        state="empty"
        title={t("emptyTitle")}
        action={
          <Button disabled={running} onClick={() => void refresh()}>
            {t("create")}
          </Button>
        }
      />
    )
  } else {
    body = <Report report={report} running={running} onRefresh={() => void refresh()} />
  }

  return (
    <AdmissionShell>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 md:p-6">
        <PageHeader title={t("title")} />
        {err?.type === "admission/quota_exceeded" ? (
          <Alert variant="destructive">
            <AlertDescription>
              {t("quota", { limit: String(err.params.limit ?? ""), period: String(err.params.period ?? "") })}
            </AlertDescription>
          </Alert>
        ) : null}
        {body}
      </div>
    </AdmissionShell>
  )
}

function Report({ report, running, onRefresh }: { report: Alignment; running: boolean; onRefresh: () => void }) {
  const t = useT("alignment")
  if (report.safety_flag === "safeguarding") {
    return (
      <Reveal>
        <section role="status" className="bg-muted flex flex-col gap-2 rounded-lg p-4">
          <h2 className="font-medium">{t("safeguardingTitle")}</h2>
          <p className="text-sm">{t("safeguardingBody")}</p>
        </section>
      </Reveal>
    )
  }
  const words = report.payload.words ?? []
  const orphans = report.payload.orphans ?? []
  const gaps = report.payload.gaps ?? []
  return (
    <Reveal>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3">
          {report.overall ? (
            <>
              <h2 className="text-sm font-medium">{t("overall")}</h2>
              <GradeChip grade={report.overall} label={t("grade", { grade: report.overall })} />
            </>
          ) : null}
          {report.stale ? <Pill>{t("stale")}</Pill> : null}
          <Button variant="outline" size="sm" disabled={running} onClick={onRefresh}>
            <Icons.sparkles />
            {running ? t("refreshing") : t("refresh")}
          </Button>
        </div>
        {report.safety_flag === "injection_suspected" ? (
          <Alert>
            <AlertDescription>{t("injection")}</AlertDescription>
          </Alert>
        ) : null}
        <ul className="flex flex-col gap-3">
          {words.map((fit) => (
            <li key={fit.word} className="flex flex-col gap-1 rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{fit.word}</span>
                <Pill>{t(`level.${fit.level}`)}</Pill>
              </div>
              {fit.carriers.length > 0 ? (
                <p className="text-muted-foreground text-xs">
                  {t("carriers", {
                    list: fit.carriers.map((c) => `${t(`kind.${c.ref_kind}`)} ${c.ref_id}`).join(", "),
                  })}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
        {gaps.length > 0 ? (
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium">{t("gaps")}</h2>
            <ul className="flex flex-col gap-2">
              {gaps.map((gap) => (
                <li key={gap.word} className="text-sm">
                  <span className="font-medium">{gap.word}:</span> {gap.advice}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {orphans.length > 0 ? (
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium">{t("orphans")}</h2>
            <p className="text-muted-foreground text-sm">
              {orphans
                .map((o) => `${t(`kind.${o.ref_kind === "course" ? "course" : "answer"}`)} ${o.ref_id}`)
                .join(", ")}
            </p>
          </section>
        ) : null}
      </div>
    </Reveal>
  )
}
