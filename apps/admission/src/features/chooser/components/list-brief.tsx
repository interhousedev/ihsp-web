"use client"

import { useErrorMessage, useLocale, useT } from "@ihsp/i18n"
import { Button, Icons, Skeleton } from "@ihsp/ui"
import { isApiError, type AdmissionListBrief as ListBrief } from "@ihsp/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"
import { BriefBar, BriefCard, BriefEm, BriefPanel, type BriefSectionSpec } from "../../../components/brief"
import { consentKeys, putConsent } from "../../consent/api"
import { useListBrief } from "../hooks"
import { AddToListButton } from "./add-to-list-button"
import { useOptionLabel } from "./option-label"

const ROLE_TONE = { safety: "success", target: "success", reach: "warning" } as const

/** Not-yet-allowed AI, a spent limit, a failure: the body of the panel instead of the brief. */
function BriefState({ error, onRetry, onGranted }: { error: unknown; onRetry: () => void; onGranted: () => void }) {
  const t = useT("brief")
  const errorMessage = useErrorMessage()
  const client = useQueryClient()
  const grant = useMutation({
    mutationFn: () => putConsent(["admission_ai"]),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: consentKeys.consent() })
      onGranted()
    },
  })
  const type = isApiError(error) ? error.type : ""
  if (type === "admission/consent_required")
    return (
      <BriefCard title={t("consent.title")} description={t("consent.text")}>
        {grant.error ? (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage(grant.error)}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="button" disabled={grant.isPending} onClick={() => grant.mutate()}>
            {t("consent.allow")}
          </Button>
          <Link href="/settings/#consent" className="text-primary inline-flex min-h-11 items-center text-sm underline">
            {t("consent.settings")}
          </Link>
        </div>
      </BriefCard>
    )
  if (type === "ai/limit-reached") return <BriefCard title={t("limit.title")} description={t("limit.text")} />
  return (
    <BriefCard title={t("error.title")} description={errorMessage(error)}>
      <div className="pt-1">
        <Button type="button" variant="outline" onClick={onRetry}>
          {t("retry")}
        </Button>
      </div>
    </BriefCard>
  )
}

function BriefLoading({ label }: { label: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className="flex flex-col gap-4">
      <Skeleton className="h-24 w-full rounded-3xl" />
      <Skeleton className="h-28 w-full rounded-3xl" />
      <Skeleton className="h-36 w-full rounded-3xl" />
    </div>
  )
}

/** Sections of the panel from the brief: balance, next steps, suggested universities with add-to-list. */
function useBriefSections(brief: ListBrief | undefined): BriefSectionSpec[] {
  const t = useT("brief")
  const locale = useLocale()
  const country = useOptionLabel("country")
  const role = useOptionLabel("bucket")
  if (!brief) return []
  const sections: BriefSectionSpec[] = [
    {
      id: "balance",
      title: t("sections.balance"),
      content: (
        <BriefBar
          title={t(`balance.${brief.balance.status}`)}
          segments={[
            { key: "reach", label: role("reach"), value: brief.balance.reach, tone: "warning" },
            { key: "target", label: role("target"), value: brief.balance.target, tone: "primary" },
            { key: "safety", label: role("safety"), value: brief.balance.safety, tone: "success" },
            ...(brief.balance.unlabelled > 0
              ? [{ key: "unlabelled", label: t("unlabelled"), value: brief.balance.unlabelled, tone: "muted" as const }]
              : []),
          ]}
        />
      ),
    },
  ]
  if (brief.next_steps.length > 0)
    sections.push({
      id: "steps",
      title: t("sections.steps"),
      content: brief.next_steps.map((step) => <BriefCard key={step} title={step} />),
    })
  sections.push({
    id: "suggestions",
    title: t("sections.suggestions"),
    content:
      brief.suggestions.length === 0 ? (
        <BriefCard title={t("noSuggestions")} />
      ) : (
        brief.suggestions.map((item) => {
          const scope = item.admit_scope ? t(`scope.${item.admit_scope}`) : null
          const admit =
            item.admit_percent == null
              ? t("noData")
              : t("admit", {
                  percent: new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(item.admit_percent),
                  scope: scope ?? "",
                  year: item.admit_year ?? "—",
                })
          return (
            <BriefCard
              key={item.institution_id}
              title={item.name}
              description={item.reason}
              status={{
                tone: ROLE_TONE[item.role],
                label: role(item.role),
                detail: `${country(item.country)} · ${admit}`,
              }}
              action={<AddToListButton institutionId={item.institution_id} />}
            />
          )
        })
      ),
  })
  return sections
}

/**
 * The button that opens the AI brief on the balance of the list, and the right-side panel with it. The AI call starts
 * when the panel opens; the consent and limit answers of the server are shown as states of the panel.
 */
export function ListBriefButton({ className }: { className?: string }) {
  const t = useT("brief")
  const locale = useLocale()
  const brief = useListBrief()
  const sections = useBriefSections(brief.data)
  const [open, setOpen] = useState(false)
  const [now] = useState(() => new Date())
  const date = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", timeZone: "Asia/Tashkent" }).format(now)
  const start = () => {
    if (!brief.isPending) brief.mutate()
  }
  function toggle(next: boolean) {
    setOpen(next)
    if (next && !brief.data && !brief.isPending) start()
  }
  return (
    <>
      <Button type="button" className={className} onClick={() => toggle(true)}>
        <Icons.sparkles aria-hidden />
        {brief.data ? t("reopen") : t("open")}
      </Button>
      <BriefPanel
        open={open}
        onOpenChange={toggle}
        title={t("title")}
        subtitle={date}
        closeLabel={t("close")}
        lead={
          brief.data ? (
            <>
              <BriefEm>{brief.data.headline}</BriefEm> {brief.data.diagnosis}
            </>
          ) : undefined
        }
        sections={sections}
        state={
          brief.isPending ? (
            <BriefLoading label={t("loading")} />
          ) : brief.isError ? (
            <BriefState error={brief.error} onRetry={start} onGranted={start} />
          ) : undefined
        }
        actions={
          brief.data ? (
            <Button type="button" variant="outline" className="rounded-full bg-card px-6" onClick={start}>
              <Icons.sparkles aria-hidden />
              {t("refresh")}
            </Button>
          ) : undefined
        }
      />
    </>
  )
}
