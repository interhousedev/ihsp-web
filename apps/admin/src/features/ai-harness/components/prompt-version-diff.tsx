"use client"

import { getAiPromptDiffQuery, type AiPromptDiffParams } from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { useFormatters, useT } from "@ihsp/i18n"
import { useQuery } from "@tanstack/react-query"
import { UnifiedDiff } from "./unified-diff"

/** The diff of one prompt version against the one before it, with the size change. */
export function PromptVersionDiff(params: AiPromptDiffParams) {
  const t = useT("aiHarness")
  const f = useFormatters()
  const query = useQuery(getAiPromptDiffQuery(params))
  const signed = (value: number) => `${value > 0 ? "+" : ""}${new Intl.NumberFormat(f.locale).format(value)}`
  return (
    <QueryState query={query} rows={2}>
      {(data) => (
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground text-xs">
            {t("diff.summary", {
              from: data.from_version,
              to: data.to_version,
              chars: signed(data.chars_delta),
              tokens: signed(data.tokens_delta),
            })}
          </p>
          <UnifiedDiff diff={data.diff} />
        </div>
      )}
    </QueryState>
  )
}
