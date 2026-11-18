"use client"

import { useT } from "@ihsp/i18n"
import { useFactSpec, type FactSpecItem, type ProposalFact } from "../api"
import { factText } from "../fact-draft"

type Shown = { key: string; label: string; item: FactSpecItem | undefined; fact: ProposalFact }

function FactLine({ shown }: { shown: Shown }) {
  const t = useT("catalogFacts")
  const { item, fact } = shown
  const label = (key: string) => {
    if (key === "yes" || key === "no") return t(key)
    return item?.options.find((o) => o.value === key)?.label ?? item?.parts.find((p) => p.key === key)?.label ?? key
  }
  return (
    <li className="flex flex-col gap-0.5 py-1.5 text-sm" data-fact={shown.key}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="text-muted-foreground">{shown.label}</span>
        <span className="font-medium break-words">{factText(item, fact.value, label)}</span>
      </div>
      <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 text-xs">
        <span>{fact.year}</span>
        <a
          className="text-primary break-all underline"
          href={fact.source_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {fact.source_url}
        </a>
        {fact.note && <span>{fact.note}</span>}
      </div>
    </li>
  )
}

/** The facts of a proposal, grouped like the spec, each with its value, year and source link. */
export function ProposalFacts({ facts }: { facts: Record<string, ProposalFact> }) {
  const t = useT("catalogFacts")
  const spec = useFactSpec()
  const known = new Set<string>()
  const groups = (spec.data?.groups ?? []).flatMap((group) => {
    const shown: Shown[] = []
    for (const item of group.facts) {
      const fact = facts[item.key]
      if (fact === undefined) continue
      known.add(item.key)
      shown.push({ key: item.key, label: item.label, item, fact })
    }
    return shown.length > 0 ? [{ key: group.key, label: group.label, shown }] : []
  })
  const rest: Shown[] = Object.entries(facts)
    .filter(([key]) => !known.has(key))
    .map(([key, fact]) => ({ key, label: key, item: undefined, fact }))
  const all = rest.length > 0 ? [...groups, { key: "other", label: t("otherGroup"), shown: rest }] : groups
  if (all.length === 0) return null
  return (
    <div className="flex flex-col gap-2" data-testid="proposal-facts">
      {all.map((group) => (
        <section key={group.key} aria-label={group.label} className="flex flex-col">
          <h3 className="text-xs font-medium uppercase tracking-wide">{group.label}</h3>
          <ul className="divide-y">
            {group.shown.map((shown) => (
              <FactLine key={shown.key} shown={shown} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
