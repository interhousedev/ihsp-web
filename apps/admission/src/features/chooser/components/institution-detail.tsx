"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { Button, Icons, StateView, Tabs, TabsContent, TabsList, TabsTrigger } from "@ihsp/ui"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { ReactNode } from "react"
import { PhotoHeader, LogoAvatar } from "../../../components/lib/photo-header"
import { percent } from "../../discover/format"
import { StatusPill } from "../../discover/components/status-pill"
import { useChances, useMatches } from "../../discover/hooks"
import { useInstitution, useScholarships } from "../hooks"
import type { Deadline as DeadlineItem, Fact, Institution } from "../types"
import { OutcomeSummary } from "../../outcomes/components/outcome-summary"
import { AddToListButton } from "./add-to-list-button"
import { AiSummary } from "./ai-summary"
import { FactRows } from "./fact-rows"
import { VerifiedBadge } from "./fact-source"
import { ChancesView } from "./chances-view"
import { ScholarshipList } from "./scholarships-table"
import { useOptionLabel } from "./option-label"
import { rowText } from "./detail/groups"
import { RichDetail } from "./detail/rich-detail"
import { sectionId } from "./detail/section-id"
import { InstitutionFit, CostText, useInstitutionRow } from "./institution-fit"
import { currencyOf, formatCurrency } from "./money"

/** Which recorded facts each tab shows; facts outside the lists go to "Campus & outcomes". */
const TAB_FACTS = {
  admission: ["acceptance_rate", "test_policy"],
  cost: ["intl_tuition_usd", "intl_coa_usd", "aid_basis", "merit_for_internationals"],
  safety: ["crime_index"],
} as const

/** Raw keys that are shown elsewhere (or are internal) and never as a fact row. */
const HIDDEN_FACTS = ["deadlines", "city_type", "fields", "institution_type"]

const TABS = ["cost", "admission", "campus", "chances"] as const
type Tab = (typeof TABS)[number]

function isTab(value: string | null): value is Tab {
  return TABS.includes(value as Tab)
}

function hasValue(fact: Fact): boolean {
  return fact.value !== null && fact.value !== undefined && fact.value !== ""
}

function pick(institution: Institution, keys: readonly string[]): [string, Fact][] {
  return keys.flatMap((key) => {
    const fact =
      institution.facts[key] ?? Object.entries(institution.facts).find(([name]) => name.toLowerCase() === key)?.[1]
    return fact ? [[key, fact] as [string, Fact]] : []
  })
}

/** "Early Decision · Nov 2": the short label when the backend gives one, otherwise the plan and a readable date. */
export function deadlineText(deadline: DeadlineItem, locale: string): string {
  if (deadline.label_short) return deadline.label_short
  const parsed = new Date(`${deadline.date}T00:00:00`)
  const date = Number.isNaN(parsed.getTime())
    ? deadline.date
    : new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(parsed)
  return [deadline.plan, date].filter(Boolean).join(" · ")
}

function Deadlines({ items }: { items: DeadlineItem[] }) {
  const locale = useLocale()
  return (
    <ul className="flex flex-col gap-2" aria-label="deadlines">
      {items.map((item, index) => (
        <li key={`${item.plan}-${item.date}-${index}`} className="flex flex-wrap items-baseline gap-x-3 text-sm">
          <span className="font-medium">{deadlineText(item, locale)}</span>
          {item.cycle ? <span className="text-muted-foreground">{item.cycle}</span> : null}
        </li>
      ))}
    </ul>
  )
}

function Panel({ value, children }: { value: Tab; children: ReactNode }) {
  return (
    <TabsContent value={value} className="pt-2">
      {children}
    </TabsContent>
  )
}

function firstDeadline(institution: Institution): DeadlineItem | undefined {
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
  return institution.deadlines
    .filter((item) => item.date && item.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0]
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm font-semibold">{children}</dd>
    </div>
  )
}

function SuggestedColleges({ currentId }: { currentId: string }) {
  const t = useT("chooser")
  const matches = useMatches()
  const items = (matches.data?.items ?? []).filter((match) => match.university_id !== currentId)
  if (items.length === 0) return null
  return (
    <section aria-label={t("detail.suggested")} className="flex flex-col gap-2">
      <h3 className="text-base font-semibold">{t("detail.suggested")}</h3>
      <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
        {items.map((match) => (
          <li key={match.university_id} className="w-56 shrink-0 snap-start">
            <Link
              href={`/chooser/institution/?id=${encodeURIComponent(match.university_id)}`}
              className="bg-card border-hairline-strong rounded-card flex h-full items-center gap-3 border p-3"
            >
              <LogoAvatar name={match.name} src={match.logo_url} className="size-10 ring-0" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{match.name}</span>
                <span className="text-muted-foreground block truncate text-xs">{match.city}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function DetailBody({ institution }: { institution: Institution }) {
  const t = useT("chooser")
  const countryLabel = useOptionLabel("country")
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const requested = params.get("tab")
  const tab: Tab = isTab(requested) ? requested : "cost"
  const scholarships = useScholarships({ institution_id: institution.id })
  const chances = useChances(institution.id)
  const listRow = useInstitutionRow(institution.id)
  const shown = new Set<string>([...Object.values(TAB_FACTS).flat(), ...HIDDEN_FACTS])
  const other = Object.entries(institution.facts).filter(([key]) => !shown.has(key.toLowerCase()))
  const rate = pick(institution, ["acceptance_rate"])[0]?.[1]
  const rateValue = typeof rate?.value === "number" ? rate.value : null
  const kind = institution.facts.institution_type ?? pick(institution, ["institution_type"])[0]?.[1]
  const deadline = firstDeadline(institution)
  const costFacts = pick(institution, TAB_FACTS.cost).filter(([, fact]) => hasValue(fact))
  const admissionFacts = pick(institution, TAB_FACTS.admission).filter(([, fact]) => hasValue(fact))
  const campusFacts = [...pick(institution, TAB_FACTS.safety), ...other].filter(([, fact]) => hasValue(fact))
  const locale = useLocale()
  const tDetails = useT("chooserDetails")
  const rich = institution.details.length > 0
  const intlCost = rowText(institution.details, "intl_coa_usd")
  const aidBasis = rowText(institution.details, "aid_basis")
  const testPolicy = rowText(institution.details, "test_policy")
  const loose = t as unknown as { (key: string): string; has: (key: string) => boolean }
  const kindLabel = (value: string) =>
    loose.has(`options.studyType.${value.toLowerCase()}`) ? loose(`options.studyType.${value.toLowerCase()}`) : value
  const hasDeadlines = institution.deadlines.length > 0
  const aid = scholarships.data ?? []
  const scholarshipBlock = scholarships.isLoading ? (
    <StateView state="loading" rows={2} />
  ) : scholarships.isError ? (
    <StateView state="error" error={scholarships.error} onRetry={() => void scholarships.refetch()} />
  ) : aid.length > 0 ? (
    <ScholarshipList items={aid} />
  ) : null
  const highlightText = (highlight: { key: string; value_text: string }) => {
    if (highlight.key !== "intl_tuition") return highlight.value_text
    for (const group of institution.details) {
      const row = group.rows.find((item) => item.key === "intl_tuition_usd")
      if (!row) continue
      const amount = formatCurrency(row.value, currencyOf(row.value_text), locale)
      if (amount) return t("detail.perYear", { value: amount })
    }
    return highlight.value_text
  }
  const highlightBlock =
    institution.highlights.length > 0 ? (
      <dl className="grid gap-3 sm:grid-cols-2" data-testid="highlights" aria-label={t("detail.highlights")}>
        {institution.highlights.map((highlight) => (
          <div key={highlight.key} className="bg-card border-hairline-strong rounded-card border p-3">
            <dt className="text-muted-foreground text-xs">{highlight.label}</dt>
            <dd className="text-sm font-semibold">{highlightText(highlight)}</dd>
          </div>
        ))}
      </dl>
    ) : null

  function select(next: string) {
    const nextParams = new URLSearchParams(params.toString())
    nextParams.set("tab", next)
    router.replace(`${pathname}?${nextParams.toString()}`)
  }

  return (
    <div className="flex flex-col gap-4 pb-20 md:pb-0">
      <PhotoHeader
        name={institution.name}
        coverUrl={institution.cover_url}
        logoUrl={institution.logo_url}
        logoFit={institution.logo_fit}
        logoZoom={institution.logo_zoom}
        title={institution.name}
        subtitle={[institution.city, countryLabel(institution.country)].filter(Boolean).join(", ")}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                rich
                  ? document
                      .getElementById(sectionId("chances"))
                      ?.scrollIntoView({ behavior: "smooth", block: "start" })
                  : select("chances")
              }
            >
              <Icons.target aria-hidden />
              {t("detail.seeChances")}
            </Button>
            <AddToListButton
              institutionId={institution.id}
              className="bg-background fixed inset-x-0 bottom-0 z-20 border-t p-3 md:static md:border-0 md:bg-transparent md:p-0"
            />
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <VerifiedBadge verified={institution.verified} />
        </div>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5" data-testid="key-stats">
          {chances.data?.status ? (
            <Stat label={t("detail.stats.status")}>
              <StatusPill status={chances.data.status} />
            </Stat>
          ) : null}
          {rateValue !== null ? <Stat label={t("detail.stats.admissionRate")}>{percent(rateValue)}</Stat> : null}
          {kind && hasValue(kind) ? <Stat label={t("detail.stats.type")}>{kindLabel(String(kind.value))}</Stat> : null}
          {listRow?.cost ? (
            <Stat label={t("detail.stats.cost")}>
              <CostText row={listRow} />
            </Stat>
          ) : institution.cost_after_aid ? (
            <Stat label={t("detail.stats.cost")}>
              ≈ {formatCurrency(institution.cost_after_aid, institution.coa_currency, locale) ?? institution.cost_after_aid}
            </Stat>
          ) : null}
          <Stat label={t("detail.stats.deadline")}>
            {deadline ? deadlineText(deadline, locale) : t("list.noDeadline")}
          </Stat>
          {rich && intlCost ? <Stat label={tDetails("stats.intlCost")}>{intlCost}</Stat> : null}
          {rich && aidBasis ? <Stat label={tDetails("stats.aid")}>{aidBasis}</Stat> : null}
          {rich && testPolicy ? <Stat label={tDetails("stats.testPolicy")}>{testPolicy}</Stat> : null}
        </dl>
      </PhotoHeader>
      {listRow ? <InstitutionFit row={listRow} /> : null}
      {rich ? <RichDetail institution={institution} chances={<ChancesView institutionId={institution.id} />} /> : null}
      {rich ? (
        <div className="flex flex-col gap-4">
          {scholarshipBlock}
          <AiSummary institutionId={institution.id} />
          {highlightBlock}
        </div>
      ) : (
        <Tabs value={tab} onValueChange={(value) => select(String(value))}>
          <TabsList className="max-w-full overflow-x-auto">
            {TABS.map((name) => (
              <TabsTrigger key={name} value={name}>
                {t(`tabs.${name}`)}
              </TabsTrigger>
            ))}
          </TabsList>
          <Panel value="cost">
            <div className="flex flex-col gap-4">
              {costFacts.length > 0 ? <FactRows facts={costFacts} sources={institution.sources} /> : null}
              {scholarshipBlock}
              {costFacts.length === 0 && !scholarships.isLoading && !scholarships.isError && aid.length === 0 ? (
                <StateView state="empty" title={t("tabEmpty.title")} description={t("tabEmpty.text")} />
              ) : null}
            </div>
          </Panel>
          <Panel value="admission">
            <div className="flex flex-col gap-4">
              {admissionFacts.length > 0 ? <FactRows facts={admissionFacts} sources={institution.sources} /> : null}
              {hasDeadlines ? <Deadlines items={institution.deadlines} /> : null}
              {admissionFacts.length === 0 && !hasDeadlines ? (
                <StateView state="empty" title={t("tabEmpty.title")} description={t("tabEmpty.text")} />
              ) : null}
            </div>
          </Panel>
          <Panel value="campus">
            <div className="flex flex-col gap-4">
              <AiSummary institutionId={institution.id} />
              {highlightBlock}
              {campusFacts.length > 0 ? <FactRows facts={campusFacts} sources={institution.sources} /> : null}
            </div>
          </Panel>
          <Panel value="chances">
            <ChancesView institutionId={institution.id} />
          </Panel>
        </Tabs>
      )}
      <section aria-label={t("detail.outcomes")} className="flex flex-col gap-2">
        <h3 className="text-base font-semibold">{t("detail.outcomes")}</h3>
        <OutcomeSummary institutionId={institution.id} />
      </section>
      {institution.sources.length > 0 ? (
        <p className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" data-testid="sources">
          <span>{t("detail.sources")}</span>
          {institution.sources
            .filter((source) => source.url)
            .map((source) => (
              <a
                key={`${source.key}-${source.url}`}
                href={source.url ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-flex min-h-11 items-center underline-offset-2 hover:underline"
              >
                {source.year ? `${t("detail.sourceLabel")} · ${source.year}` : t("detail.sourceLabel")}
              </a>
            ))}
        </p>
      ) : null}
      <SuggestedColleges currentId={institution.id} />
    </div>
  )
}

export function InstitutionDetail() {
  const t = useT("chooser")
  const id = useSearchParams().get("id")
  const query = useInstitution(id)
  if (!id)
    return (
      <StateView
        state="empty"
        title={t("detail.missingTitle")}
        action={<Link href="/chooser/?step=match">{t("detail.back")}</Link>}
      />
    )
  if (query.isLoading) return <StateView state="loading" rows={4} />
  if (query.isError || !query.data)
    return <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
  return <DetailBody institution={query.data} />
}
