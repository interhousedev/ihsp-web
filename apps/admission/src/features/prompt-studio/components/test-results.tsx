"use client"

import { useT } from "@ihsp/i18n"
import { Pill } from "@ihsp/ui"
import type { RunOut, SampleResult } from "../api"

function Run({ title, run }: { title: string; run: RunOut }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <h5 className="text-xs font-medium">
        {title} <span className="text-muted-foreground font-normal">{run.model}</span>
      </h5>
      <pre className="bg-muted/40 max-h-80 overflow-auto rounded-md p-2 font-mono text-xs whitespace-pre-wrap">
        {JSON.stringify(run.output, null, 2)}
      </pre>
    </div>
  )
}

/** The structured review of the active prompt next to the draft's, with the score and band change. */
export function TestResults({ results }: { results: SampleResult[] }) {
  const t = useT("promptStudio")
  return (
    <ul className="flex flex-col gap-4" data-testid="studio-results">
      {results.map((r, i) => (
        <li key={`${r.label}-${i}`} className="border-hairline flex flex-col gap-3 rounded-card border p-3">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-medium">{r.label}</h4>
            {r.delta.score_delta !== null ? (
              <Pill tone={r.delta.score_delta === 0 ? "neutral" : r.delta.score_delta > 0 ? "success" : "warning"}>
                {t("test.scoreDelta", {
                  delta: r.delta.score_delta > 0 ? `+${r.delta.score_delta}` : r.delta.score_delta,
                })}
              </Pill>
            ) : null}
            {r.delta.band_changed ? (
              <Pill tone="primary">
                {t("test.band", { before: r.delta.band_before ?? "—", after: r.delta.band_after ?? "—" })}
              </Pill>
            ) : null}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Run title={t("test.active")} run={r.active} />
            <Run title={t("test.draft")} run={r.draft} />
          </div>
        </li>
      ))}
    </ul>
  )
}
