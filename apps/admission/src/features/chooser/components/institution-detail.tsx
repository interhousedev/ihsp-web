"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, StateView, Tabs, TabsContent, TabsList, TabsTrigger } from "@ihsp/ui"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { ReactNode } from "react"
import { PhotoHeader, LogoAvatar } from "../../../components/lib/photo-header"
import { percent } from "../../discover/format"
import { StatusPill } from "../../discover/components/status-pill"
import { useChances, useMatches } from "../../discover/hooks"
import { useInstitution, useScholarships } from "../hooks"
import type { Fact, Institution } from "../types"
import { AddToListButton } from "./add-to-list-button"
import { AiSummary } from "./ai-summary"
import { FactRows } from "./fact-rows"
import { FactSource, VerifiedBadge } from "./fact-source"
import { formatMoney } from "./institution-card"
import { ChancesView } from "./chances-view"
import { ScholarshipList } from "./scholarships-table"
import { useOptionLabel } from "./option-label"

/** Which recorded facts each tab shows; facts outside the lists go to "Campus & outcomes". */
const TAB_FACTS = {
  admission: ["acceptance_rate", "test_policy"],
  cost: ["intl_tuition_usd", "intl_coa_usd", "aid_basis", "merit_for_internationals"],
  safety: ["crime_index"],
} as const

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

type Deadline = { plan?: string; date?: string; cycle?: string; note?: string; source_url?: string }

function Deadlines({ fact }: { fact: Fact | undefined }) {
  const t = useT("chooser")
  const items = Array.isArray(fact?.value) ? (fact.value as Deadline[]) : []
  if (!fact || items.length === 0)
    return <StateView state="empty" title={t("tabEmpty.title")} description={t("tabEmpty.text")} />
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {items.map((item, index) => (
          <li key={`${item.plan}-${index}`} className="flex flex-wrap items-baseline gap-x-3 text-sm">
            <span className="font-medium">{item.plan}</span>
            <span>{item.date}</span>
            {item.cycle ? <span className="text-muted-foreground">{item.cycle}</span> : null}
            {item.note ? <span className="text-muted-foreground">{item.note}</span> : null}
          </li>
        ))}
      </ul>
      <FactSource fact={fact} />
    </div>
  )
}

function Panel({ value, children }: { value: Tab; children: ReactNode }) {
  return (
    <TabsContent value={value} className="pt-2">
      {children}
    </TabsContent>
  )
}

function firstDeadline(institution: Institution): Deadline | undefined {
  const value = institution.facts.deadlines?.value
  return Array.isArray(value) ? (value as Deadline[]).find((item) => item.date) : undefined
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
  const shown = new Set<string>([...Object.values(TAB_FACTS).flat(), "deadlines"])
  const other = Object.entries(institution.facts).filter(([key]) => !shown.has(key.toLowerCase()))
  const rate = pick(institution, ["acceptance_rate"])[0]?.[1]
  const rateValue = typeof rate?.value === "number" ? rate.value : null
  const kind = pick(institution, ["institution_type"])[0]?.[1]
  const deadline = firstDeadline(institution)
  const costFacts = pick(institution, TAB_FACTS.cost).filter(([, fact]) => hasValue(fact))
  const admissionFacts = pick(institution, TAB_FACTS.admission).filter(([, fact]) => hasValue(fact))
  const campusFacts = [...pick(institution, TAB_FACTS.safety), ...other].filter(([, fact]) => hasValue(fact))
  const hasDeadlines = Array.isArray(institution.facts.deadlines?.value) && institution.facts.deadlines.value.length > 0
  const kindLabel = (value: string) =>
    loose.has(`options.studyType.${value.toLowerCase()}`) ? loose(`options.studyType.${value.toLowerCase()}`) : value
  const aid = scholarships.data ?? []

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
        title={institution.name}
        subtitle={[institution.city, countryLabel(institution.country)].filter(Boolean).join(", ")}
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => select("chances")}>
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
          {institution.coa_total ? (
            <Stat label={t("detail.stats.cost")}>{formatMoney(institution.coa_total, institution.coa_currency)}</Stat>
          ) : null}
          {deadline?.date ? <Stat label={t("detail.stats.deadline")}>{deadline.date}</Stat> : null}
        </dl>
      </PhotoHeader>
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
            {costFacts.length > 0 ? <FactRows facts={costFacts} /> : null}
            {scholarships.isLoading ? (
              <StateView state="loading" rows={2} />
            ) : scholarships.isError ? (
              <StateView state="error" error={scholarships.error} onRetry={() => void scholarships.refetch()} />
            ) : aid.length > 0 ? (
              <ScholarshipList items={aid} />
            ) : null}
            {costFacts.length === 0 && !scholarships.isLoading && !scholarships.isError && aid.length === 0 ? (
              <StateView state="empty" title={t("tabEmpty.title")} description={t("tabEmpty.text")} />
            ) : null}
          </div>
        </Panel>
        <Panel value="admission">
          <div className="flex flex-col gap-4">
            {admissionFacts.length > 0 ? <FactRows facts={admissionFacts} /> : null}
            {hasDeadlines ? <Deadlines fact={institution.facts.deadlines} /> : null}
            {admissionFacts.length === 0 && !hasDeadlines ? (
              <StateView state="empty" title={t("tabEmpty.title")} description={t("tabEmpty.text")} />
            ) : null}
          </div>
        </Panel>
        <Panel value="campus">
          <div className="flex flex-col gap-4">
            <AiSummary institutionId={institution.id} />
            {campusFacts.length > 0 ? <FactRows facts={campusFacts} /> : null}
          </div>
        </Panel>
        <Panel value="chances">
          <ChancesView institutionId={institution.id} />
        </Panel>
      </Tabs>
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
        action={<Link href="/chooser/search/">{t("detail.back")}</Link>}
      />
    )
  if (query.isLoading) return <StateView state="loading" rows={4} />
  if (query.isError || !query.data)
    return <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
  return <DetailBody institution={query.data} />
}
