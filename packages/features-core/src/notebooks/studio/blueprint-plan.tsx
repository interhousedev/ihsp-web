"use client"

import type { AssessmentBlueprint } from "@ihsp/api"
import { useT } from "@ihsp/i18n"

/** How many times each value occurs, in order of first appearance. */
function tally(values: readonly string[]): [string, number][] {
  const counts = new Map<string, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return [...counts]
}

/** Template and domain names are data: shown with spaces for underscores. */
function words(value: string): string {
  return value.replace(/_/g, " ")
}

/**
 * The plan a quiz or card set was made from: the test type, how many items were asked for and delivered, the items per
 * template and per domain, and the kinds of the sources.
 */
export function BlueprintPlan({ blueprint }: { blueprint: AssessmentBlueprint }) {
  const t = useT("notebooks")
  const sourceKinds = [...new Set(blueprint.profiles.map((profile) => profile.kind))]
  const templates = tally(blueprint.items.map((item) => item.template))
  const domains = tally(blueprint.items.map((item) => item.domain))

  return (
    <section aria-label={t("studio.blueprint.title")} className="flex flex-col gap-2">
      <h3 className="text-muted-foreground text-sm">{t("studio.blueprint.title")}</h3>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">{t("studio.blueprint.mode")}</dt>
        <dd>{t(`opt.mode.${blueprint.mode}`)}</dd>
        <dt className="text-muted-foreground">{t("studio.blueprint.items")}</dt>
        <dd>
          {t("studio.blueprint.delivered", { delivered: blueprint.delivered, requested: blueprint.requested })}
          {blueprint.rejected > 0 ? ` (${t("studio.blueprint.rejected", { count: blueprint.rejected })})` : null}
        </dd>
        {sourceKinds.length > 0 ? (
          <>
            <dt className="text-muted-foreground">{t("studio.blueprint.sources")}</dt>
            <dd>{sourceKinds.map((kind) => t(`opt.sourceKind.${kind}`)).join(", ")}</dd>
          </>
        ) : null}
      </dl>
      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <TallyList title={t("studio.blueprint.byTemplate")} rows={templates} />
        <TallyList title={t("studio.blueprint.byDomain")} rows={domains} />
      </div>
    </section>
  )
}

function TallyList({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <div className="flex flex-col gap-1">
      <h4 className="text-muted-foreground">{title}</h4>
      <ul className="flex flex-col gap-0.5">
        {rows.map(([name, count]) => (
          <li key={name} className="flex justify-between gap-2">
            <span className="break-words">{words(name)}</span>
            <span className="tabular-nums">{count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
