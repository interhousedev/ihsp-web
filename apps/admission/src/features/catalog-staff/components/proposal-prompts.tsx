"use client"

import { useT } from "@ihsp/i18n"
import type { ProposalSuppPrompt } from "../api"

/** The supplement prompts a proposal carries, per cycle, each with its word limit and source link. */
export function ProposalPrompts({ prompts }: { prompts: ProposalSuppPrompt[] }) {
  const t = useT("catalogFacts")
  const cycles = [...new Set(prompts.map((p) => p.cycle))]
  return (
    <div className="flex flex-col gap-2" data-testid="proposal-prompts">
      <h3 className="text-xs font-medium uppercase tracking-wide">{t("suppPromptsTitle")}</h3>
      {cycles.map((cycle) => (
        <section key={cycle} aria-label={cycle} className="flex flex-col gap-1">
          <h4 className="text-muted-foreground text-xs">{cycle}</h4>
          <ol className="flex flex-col divide-y">
            {prompts
              .filter((p) => p.cycle === cycle)
              .map((p, index) => (
                <li key={`${cycle}-${index}`} className="flex flex-col gap-0.5 py-1.5 text-sm">
                  <span className="break-words">{p.prompt}</span>
                  <span className="text-muted-foreground flex flex-wrap items-center gap-x-2 text-xs">
                    {p.word_limit !== null && <span>{t("suppPromptLimit", { count: p.word_limit })}</span>}
                    {!p.required && <span>{t("suppPromptOptional")}</span>}
                    <a
                      className="text-primary break-all underline"
                      href={p.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {p.source_url}
                    </a>
                  </span>
                </li>
              ))}
          </ol>
        </section>
      ))}
    </div>
  )
}
