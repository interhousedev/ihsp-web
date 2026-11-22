"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { StateView, Tabs, TabsContent, TabsList, TabsTrigger } from "@ihsp/ui"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { ReactNode } from "react"
import { LogoAvatar } from "../../../components/lib/photo-header"
import { InstitutionFocuses } from "../../../components/lib/institution-focuses"
import { useMatches } from "../../discover/hooks"
import { OutcomeSummary } from "../../outcomes/components/outcome-summary"
import { useEstimatesVisible } from "../../../config/applicant"
import { useInstitution, useScholarships } from "../hooks"
import type { Deadline as DeadlineItem, Fact, Institution } from "../types"
import { AddToListButton } from "./add-to-list-button"
import { ChancesView } from "./chances-view"
import { hasSections, RichSections } from "./detail/rich-detail"
import { FactRows } from "./fact-rows"
import { ApplyActions } from "./institution-apply"
import { InstitutionFit } from "./institution-fit"
import { InstitutionHeader } from "./institution-header"
import { IntlStrip } from "./institution-intl-strip"
import { useIntlFigures } from "./intl-figures"
import { currencyOf, formatCurrency } from "./money"
import { useOptionLabel } from "./option-label"
import { AidFacts } from "../../budget/components/aid-facts"
import { ScholarshipList } from "./scholarships-table"

/** Which recorded facts each tab shows; facts outside the lists go to "Facts". */
const TAB_FACTS = {
  admission: ["acceptance_rate", "test_policy"],
  cost: ["intl_tuition_usd", "intl_coa_usd", "aid_basis", "merit_for_internationals"],
  safety: ["crime_index"],
} as const

/** Raw keys that are shown elsewhere (or are internal) and never as a fact row. */
const HIDDEN_FACTS = ["deadlines", "city_type", "fields", "institution_type"]

const TABS = ["fit", "facts", "money", "apply", "iht"] as const
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

function firstDeadline(institution: Institution): DeadlineItem | undefined {
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
  return institution.deadlines
    .filter((item) => item.date && item.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0]
}

/** Universities of the same country that fit: from the matching feed, fit at least 50 (match percent when there is no fit). */
function SuggestedColleges({ institution }: { institution: Institution }) {
  const t = useT("chooser")
  const matches = useMatches()
  const country = institution.country.trim().toLowerCase()
  const items = (matches.data?.items ?? []).filter(
    (match) =>
      match.university_id !== institution.id &&
      match.country.trim().toLowerCase() === country &&
      (match.fit_total ?? match.match_pct) >= 50,
  )
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

function Panel({ value, children }: { value: Tab; children: ReactNode }) {
  return (
    <TabsContent value={value} className="flex flex-col gap-4 pt-3 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
      {children}
    </TabsContent>
  )
}

function DetailBody({ institution }: { institution: Institution }) {
  const t = useT("chooser")
  const tDetails = useT("chooserDetails")
  const tBudget = useT("budget")
  const locale = useLocale()
  const countryLabel = useOptionLabel("country")
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const requested = params.get("tab")
  const tab: Tab = isTab(requested) ? requested : "fit"
  const scholarships = useScholarships({ institution_id: institution.id })
  const figures = useIntlFigures(institution)
  const { row } = figures
  const estimatesOn = useEstimatesVisible()
  const rich = institution.details.length > 0
  const shown = new Set<string>([...Object.values(TAB_FACTS).flat(), ...HIDDEN_FACTS])
  const other = Object.entries(institution.facts).filter(([key]) => !shown.has(key.toLowerCase()))
  const costFacts = pick(institution, TAB_FACTS.cost).filter(([, fact]) => hasValue(fact))
  const admissionFacts = pick(institution, TAB_FACTS.admission).filter(([, fact]) => hasValue(fact))
  const campusFacts = [...pick(institution, TAB_FACTS.safety), ...other].filter(([, fact]) => hasValue(fact))
  const deadline = firstDeadline(institution)
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
      const detail = group.rows.find((item) => item.key === "intl_tuition_usd")
      if (!detail) continue
      const amount = formatCurrency(detail.value, currencyOf(detail.value_text), locale)
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
  const empty = <StateView state="empty" title={t("tabEmpty.title")} description={t("tabEmpty.text")} />
  const factGroups = ["overview", "selectivity", "english", "credentials"] as const
  const moneyGroups = ["costs"] as const
  const applyGroups = ["application", "visa"] as const
  const factsEmpty = rich ? !hasSections(institution, factGroups) : admissionFacts.length + campusFacts.length === 0
  const profile = institution.aid_profile
  const aidSplit =
    profile != null && [profile.grant_pct, profile.loan_pct, profile.work_pct].some((share) => share != null)
  const moneyEmpty =
    !aidSplit &&
    (rich ? !hasSections(institution, moneyGroups) : costFacts.length === 0) &&
    !scholarships.isLoading &&
    !scholarships.isError &&
    aid.length === 0

  function select(next: string) {
    const nextParams = new URLSearchParams(params.toString())
    nextParams.set("tab", next)
    router.replace(`${pathname}?${nextParams.toString()}`)
  }

  return (
    <div className="flex flex-col gap-4 pb-20 md:pb-0 lg:h-[calc(100dvh-3rem)] lg:pb-0">
      <InstitutionHeader
        institution={institution}
        place={[institution.city, countryLabel(institution.country)].filter(Boolean).join(", ")}
        row={row}
      />
      <IntlStrip figures={figures} deadline={deadline ? deadlineText(deadline, locale) : t("list.noDeadline")} />
      <Tabs
        value={tab}
        onValueChange={(value) => select(String(value))}
        className="lg:flex lg:min-h-0 lg:flex-1 lg:flex-col"
      >
        <TabsList className="max-w-full justify-start overflow-x-auto">
          {TABS.map((name) => (
            <TabsTrigger key={name} value={name}>
              {t(`detail.tab.${name}`)}
            </TabsTrigger>
          ))}
        </TabsList>
        <Panel value="fit">
          {row ? (
            <InstitutionFit row={row} />
          ) : (
            <section className="bg-card flex flex-wrap items-center justify-between gap-3 rounded-card border p-4">
              <p className="text-muted-foreground min-w-0 flex-1 basis-60 text-sm">{t("detail.fitHint")}</p>
              <AddToListButton institutionId={institution.id} />
            </section>
          )}
          {estimatesOn ? (
            <section aria-label={t("detail.seeChances")} className="flex flex-col gap-2">
              <h3 className="text-base font-semibold">{t("detail.seeChances")}</h3>
              <ChancesView institutionId={institution.id} showQuestions={false} />
            </section>
          ) : null}
          <InstitutionFocuses name={institution.name} focuses={institution.focuses} />
          <SuggestedColleges institution={institution} />
        </Panel>
        <Panel value="facts">
          {rich ? <RichSections institution={institution} groups={factGroups} /> : null}
          {!rich && admissionFacts.length + campusFacts.length > 0 ? (
            <FactRows facts={[...admissionFacts, ...campusFacts]} sources={institution.sources} />
          ) : null}
          {highlightBlock}
          {factsEmpty && !highlightBlock ? empty : null}
        </Panel>
        <Panel value="money">
          {rich ? <RichSections institution={institution} groups={moneyGroups} /> : null}
          {!rich && costFacts.length > 0 ? <FactRows facts={costFacts} sources={institution.sources} /> : null}
          {aidSplit ? (
            <section className="flex flex-col gap-2">
              <h3 className="text-base font-semibold">{tBudget("aid.title")}</h3>
              <AidFacts aid={institution.aid_profile ?? null} showAdmit={false} />
            </section>
          ) : null}
          {scholarshipBlock}
          {moneyEmpty ? empty : null}
        </Panel>
        <Panel value="apply">
          {rich ? <RichSections institution={institution} groups={applyGroups} /> : null}
          {!rich && admissionFacts.length > 0 ? (
            <FactRows facts={admissionFacts} sources={institution.sources} />
          ) : null}
          {!rich && institution.deadlines.length > 0 ? <Deadlines items={institution.deadlines} /> : null}
          <ApplyActions row={row} />
        </Panel>
        <Panel value="iht">
          <section aria-label={t("detail.outcomes")} className="flex flex-col gap-2">
            <h3 className="text-base font-semibold">{t("detail.outcomes")}</h3>
            <OutcomeSummary institutionId={institution.id} />
          </section>
        </Panel>
      </Tabs>
      {institution.sources.length > 0 ? (
        <p className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" data-testid="sources">
          <span>{t("detail.sources")}</span>
          {institution.sources
            .filter((source, index, all) => source.url && all.findIndex((other) => other.url === source.url) === index)
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
