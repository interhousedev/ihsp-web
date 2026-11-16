"use client"

import { useT } from "@ihsp/i18n"
import { Icons, StateView, Tabs, TabsContent, TabsList, TabsTrigger } from "@ihsp/ui"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { ReactNode } from "react"
import { useInstitution, useScholarships } from "../hooks"
import type { Fact, Institution } from "../types"
import { AddToListButton } from "./add-to-list-button"
import { AiSummary } from "./ai-summary"
import { FactRows } from "./fact-rows"
import { FactSource, VerifiedBadge } from "./fact-source"
import { formatMoney } from "./institution-card"
import { ScholarshipList } from "./scholarships-table"

/** Which recorded facts each tab shows; facts outside the lists are shown on the overview. */
const TAB_FACTS = {
  admission: ["acceptance_rate", "test_policy"],
  cost: ["intl_tuition_usd", "intl_coa_usd", "aid_basis", "merit_for_internationals"],
  safety: ["crime_index"],
} as const

const TABS = ["overview", "admission", "cost", "scholarships", "safety", "deadlines"] as const
type Tab = (typeof TABS)[number]

function isTab(value: string | null): value is Tab {
  return TABS.includes(value as Tab)
}

function pick(institution: Institution, keys: readonly string[]): [string, Fact][] {
  return keys.flatMap((key) => (institution.facts[key] ? [[key, institution.facts[key]] as [string, Fact]] : []))
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

function DetailBody({ institution }: { institution: Institution }) {
  const t = useT("chooser")
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const requested = params.get("tab")
  const tab: Tab = isTab(requested) ? requested : "overview"
  const scholarships = useScholarships({ institution_id: institution.id })
  const shown = new Set<string>([...Object.values(TAB_FACTS).flat(), "deadlines"])
  const other = Object.entries(institution.facts).filter(([key]) => !shown.has(key))

  function select(next: string) {
    const nextParams = new URLSearchParams(params.toString())
    nextParams.set("tab", next)
    router.replace(`${pathname}?${nextParams.toString()}`)
  }

  return (
    <div className="flex flex-col gap-4 pb-20 md:pb-0">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold">{institution.name}</h2>
          <p className="text-muted-foreground text-sm">
            {[institution.city, institution.country].filter(Boolean).join(", ")}
          </p>
          <div className="pt-2">
            <VerifiedBadge verified={institution.verified} />
          </div>
        </div>
        <AddToListButton
          institutionId={institution.id}
          className="bg-background fixed inset-x-0 bottom-0 z-20 border-t p-3 md:static md:border-0 md:bg-transparent md:p-0"
        />
      </header>
      <Tabs value={tab} onValueChange={(value) => select(String(value))}>
        <TabsList className="max-w-full overflow-x-auto">
          {TABS.map((name) => (
            <TabsTrigger key={name} value={name}>
              {t(`tabs.${name}`)}
            </TabsTrigger>
          ))}
        </TabsList>
        <Panel value="overview">
          <div className="flex flex-col gap-4">
            <AiSummary institutionId={institution.id} />
            {institution.coa_total ? (
              <p className="text-sm">
                {t("cost", { amount: formatMoney(institution.coa_total, institution.coa_currency) })}
              </p>
            ) : null}
            <FactRows facts={other} />
          </div>
        </Panel>
        <Panel value="admission">
          <FactRows facts={pick(institution, TAB_FACTS.admission)} />
        </Panel>
        <Panel value="cost">
          <FactRows facts={pick(institution, TAB_FACTS.cost)} />
        </Panel>
        <Panel value="scholarships">
          {scholarships.isLoading ? (
            <StateView state="loading" rows={2} />
          ) : scholarships.isError ? (
            <StateView state="error" error={scholarships.error} onRetry={() => void scholarships.refetch()} />
          ) : (
            <ScholarshipList items={scholarships.data ?? []} />
          )}
        </Panel>
        <Panel value="safety">
          <FactRows facts={pick(institution, TAB_FACTS.safety)} />
        </Panel>
        <Panel value="deadlines">
          <Deadlines fact={institution.facts.deadlines} />
        </Panel>
      </Tabs>
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
