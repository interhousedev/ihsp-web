"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Label, Textarea } from "@ihsp/ui"
import { useState } from "react"
import { InstitutionCombobox } from "../../chooser/components/institution-combobox"
import type { Institution } from "../../chooser/types"
import { useExemplars as useStaffExemplars } from "../../exemplars-staff/api"
import { blockingCodes, useTestSlot, type Sample, type Slot } from "../api"
import { asIssues, IssueList } from "./issue-list"
import { TestResults } from "./test-results"

const MAX_SAMPLES = 3
const PUBLISHED = { q: "", status: "published", institutionId: null, year: null } as const

type Draft = { exemplarId: string; text: string }

/** Runs the draft and the active prompt on up to three pasted essays or library exemplars and shows the comparison. */
export function TestPanel({ slot, text }: { slot: Slot; text: string }) {
  const t = useT("promptStudio")
  const errorMessage = useErrorMessage()
  const run = useTestSlot(slot)
  const exemplars = useStaffExemplars(PUBLISHED)
  const [samples, setSamples] = useState<Draft[]>([{ exemplarId: "", text: "" }])
  const [institution, setInstitution] = useState<Institution | null>(null)
  const patch = (i: number, next: Partial<Draft>) =>
    setSamples((all) => all.map((s, k) => (k === i ? { ...s, ...next } : s)))
  const body: Sample[] = samples.map((s) => (s.exemplarId ? { exemplar_id: s.exemplarId } : { text: s.text }))
  const ready = text.trim() !== "" && samples.every((s) => s.exemplarId || s.text.trim())
  const codes = blockingCodes(run.error)
  return (
    <section className="flex flex-col gap-3" aria-label={t("test.title")}>
      <h3 className="font-medium">{t("test.title")}</h3>
      <p className="text-muted-foreground text-xs">{t("limit")}</p>
      {samples.map((s, i) => (
        <div key={i} className="border-hairline flex flex-col gap-2 rounded-card border p-3">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor={`studio-sample-${i}`}>{t("test.sample", { n: i + 1 })}</Label>
            {samples.length > 1 ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setSamples((all) => all.filter((_, k) => k !== i))}
              >
                {t("test.remove")}
              </Button>
            ) : null}
          </div>
          <select
            aria-label={t("test.exemplar")}
            className="border-input bg-background h-9 rounded-md border px-3 text-sm"
            value={s.exemplarId}
            onChange={(e) => patch(i, { exemplarId: e.target.value })}
          >
            <option value="">{t("test.pasteOwn")}</option>
            {(exemplars.data?.items ?? []).map((x) => (
              <option key={x.id} value={x.id}>
                {x.title || x.school_name}
              </option>
            ))}
          </select>
          {s.exemplarId ? null : (
            <Textarea
              id={`studio-sample-${i}`}
              rows={6}
              value={s.text}
              onChange={(e) => patch(i, { text: e.target.value })}
            />
          )}
        </div>
      ))}
      {samples.length < MAX_SAMPLES ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="self-start"
          onClick={() => setSamples((all) => [...all, { exemplarId: "", text: "" }])}
        >
          {t("test.add")}
        </Button>
      ) : (
        <p className="text-muted-foreground text-xs">{t("samplesMax")}</p>
      )}
      <div className="flex flex-col gap-1">
        <Label htmlFor="studio-institution">{t("test.institution")}</Label>
        <InstitutionCombobox id="studio-institution" value={institution} onChange={setInstitution} />
      </div>
      <IssueList issues={asIssues(codes)} tone="error" />
      {run.isError && codes.length === 0 ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(run.error)}
        </p>
      ) : null}
      <Button
        type="button"
        className="self-start"
        disabled={!ready || run.isPending}
        onClick={() => run.mutate({ text, samples: body, institution_id: institution?.id ?? null })}
      >
        {run.isPending ? t("test.running") : t("test.run")}
      </Button>
      {run.data ? (
        <>
          <IssueList issues={run.data.warnings} tone="warning" />
          <TestResults results={run.data.results} />
        </>
      ) : null}
    </section>
  )
}
