"use client"

import { useT } from "@ihsp/i18n"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Badge, Checkbox, Input, Label } from "@ihsp/ui"
import type { FactSpecGroup, FactSpecItem } from "../api"
import {
  emptyCitation,
  emptyDraft,
  filledCount,
  type Citation,
  type Draft,
  type FactEntry,
  type FactsState,
  type SectionSource,
} from "../fact-draft"
import { FactField } from "./fact-field"

export type FactError = { fact: string; reason: string }

function CitationInputs({
  prefix,
  citation,
  disabled,
  onChange,
}: {
  prefix: string
  citation: Citation
  disabled?: boolean
  onChange: (next: Citation) => void
}) {
  const t = useT("catalogFacts")
  return (
    <div className="grid grid-cols-[1fr_5rem] gap-2">
      <Input
        type="url"
        aria-label={`${prefix}: ${t("sourceUrl")}`}
        placeholder={t("sourceUrl")}
        disabled={disabled}
        value={citation.url}
        onChange={(e) => onChange({ ...citation, url: e.target.value })}
      />
      <Input
        type="number"
        inputMode="numeric"
        aria-label={`${prefix}: ${t("sourceYear")}`}
        disabled={disabled}
        value={citation.year}
        onChange={(e) => onChange({ ...citation, year: e.target.value })}
      />
      <Input
        className="col-span-2"
        aria-label={`${prefix}: ${t("sourceNote")}`}
        placeholder={t("sourceNote")}
        maxLength={300}
        disabled={disabled}
        value={citation.note}
        onChange={(e) => onChange({ ...citation, note: e.target.value })}
      />
    </div>
  )
}

function FactRow({
  item,
  entry,
  section,
  error,
  onChange,
}: {
  item: FactSpecItem
  entry: FactEntry | undefined
  section: SectionSource | undefined
  error: string | null
  onChange: (entry: FactEntry) => void
}) {
  const current: FactEntry = entry ?? { draft: emptyDraft(item), ...emptyCitation() }
  const cited = section?.same ?? false
  return (
    <div className="flex flex-col gap-1.5 py-2" data-fact={item.key}>
      <Label className="text-muted-foreground text-[13px] font-normal">{item.label}</Label>
      <FactField item={item} draft={current.draft} onChange={(draft: Draft) => onChange({ ...current, draft })} />
      {!cited && (
        <CitationInputs
          prefix={item.label}
          citation={current}
          onChange={(citation) => onChange({ ...current, ...citation })}
        />
      )}
      {error && (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  )
}

function SectionSourceBox({
  group,
  section,
  onChange,
}: {
  group: FactSpecGroup
  section: SectionSource | undefined
  onChange: (next: SectionSource) => void
}) {
  const t = useT("catalogFacts")
  const current: SectionSource = section ?? { same: false, ...emptyCitation() }
  return (
    <div className="flex flex-col gap-1.5 rounded-card border p-2">
      <label className="flex items-center gap-2 text-[13px]">
        <Checkbox checked={current.same} onCheckedChange={(on) => onChange({ ...current, same: on === true })} />
        {t("sameSource")}
      </label>
      {current.same && (
        <CitationInputs
          prefix={group.label}
          citation={current}
          onChange={(citation) => onChange({ ...current, ...citation })}
        />
      )}
    </div>
  )
}

/** Step 2: one accordion section per group of the spec, with the count of filled facts and a citation per fact. */
export function FactsStep({
  groups,
  state,
  open,
  error,
  errorText,
  onOpenChange,
  onChange,
}: {
  groups: FactSpecGroup[]
  state: FactsState
  open: string[]
  error: FactError | null
  errorText: string
  onOpenChange: (open: string[]) => void
  onChange: (state: FactsState) => void
}) {
  const t = useT("catalogFacts")
  return (
    <Accordion multiple value={open} onValueChange={(next) => onOpenChange(next as string[])}>
      {groups.map((group) => {
        const count = filledCount(group.facts, state)
        const section = state.sections[group.key]
        return (
          <AccordionItem key={group.key} value={group.key}>
            <AccordionTrigger>
              <span className="flex flex-1 items-center gap-2">
                {group.label}
                {count > 0 && <Badge variant="secondary">{t("filled", { count })}</Badge>}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col divide-y">
                {group.facts.length > 1 && (
                  <div className="pb-2">
                    <SectionSourceBox
                      group={group}
                      section={section}
                      onChange={(next) => onChange({ ...state, sections: { ...state.sections, [group.key]: next } })}
                    />
                  </div>
                )}
                {group.facts.map((item) => (
                  <FactRow
                    key={item.key}
                    item={item}
                    entry={state.facts[item.key]}
                    section={section}
                    error={error?.fact === item.key ? errorText : null}
                    onChange={(entry) => onChange({ ...state, facts: { ...state.facts, [item.key]: entry } })}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}
