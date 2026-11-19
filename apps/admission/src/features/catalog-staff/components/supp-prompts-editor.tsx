"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Checkbox, Input, Label, LoadingButton, ResponsiveDialog, Skeleton, Textarea } from "@ihsp/ui"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import {
  useInstitutionSearch,
  usePutSuppPrompts,
  useSuppCycles,
  type InstitutionHit,
  type SuppCycle,
  type SuppPromptInput,
} from "../api"

type Row = { prompt: string; word_limit: string; required: boolean; source_url: string }

const CYCLE = /^\d{4}-\d{2}$/
const EMPTY: Row = { prompt: "", word_limit: "", required: true, source_url: "" }

/** The admission cycle that opens in August: November 2026 is "2026-27". */
export function currentCycle(now: Date): string {
  const start = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`
}

function rowsOf(cycle: SuppCycle | undefined): Row[] {
  const active = cycle?.prompts.filter((p) => p.status !== "removed") ?? []
  return active.map((p) => ({
    prompt: p.prompt,
    word_limit: p.word_limit ? String(p.word_limit) : "",
    required: p.required,
    source_url: p.source_url ?? "",
  }))
}

/** Edits the prompt list of one cycle and replaces it on save. */
function CycleForm({
  target,
  cycle,
  initial,
  onDone,
}: {
  target: InstitutionHit
  cycle: string
  initial: Row[]
  onDone: () => void
}) {
  const t = useT("catalogStaff")
  const errorMessage = useErrorMessage()
  const put = usePutSuppPrompts()
  const [rows, setRows] = useState<Row[]>(initial)
  const update = (i: number, patch: Partial<Row>) =>
    setRows((current) => current.map((r, j) => (j === i ? { ...r, ...patch } : r)))

  async function submit(event: FormEvent) {
    event.preventDefault()
    const prompts: SuppPromptInput[] = rows.map((r) => ({
      prompt: r.prompt.trim(),
      word_limit: r.word_limit ? Number(r.word_limit) : null,
      required: r.required,
      source_url: r.source_url.trim() || null,
    }))
    try {
      await put.mutateAsync({ id: target.id, cycle, prompts })
      toast.success(t("suppSaved"))
      onDone()
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <form id="supp-prompts-form" onSubmit={submit} className="flex flex-col gap-4">
      {rows.map((row, i) => (
        <fieldset key={i} className="flex flex-col gap-2 rounded-card border p-3">
          <legend className="px-1 text-xs">{t("suppPromptN", { n: i + 1 })}</legend>
          <Textarea
            aria-label={t("suppPrompt")}
            required
            maxLength={4000}
            value={row.prompt ?? ""}
            onChange={(e) => update(i, { prompt: e.target.value })}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              aria-label={t("suppWordLimit")}
              placeholder={t("suppWordLimit")}
              type="number"
              min={1}
              max={5000}
              value={row.word_limit ?? ""}
              onChange={(e) => update(i, { word_limit: e.target.value })}
            />
            <Input
              aria-label={t("suppSource")}
              placeholder={t("suppSource")}
              type="url"
              pattern="https://.*"
              value={row.source_url ?? ""}
              onChange={(e) => update(i, { source_url: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label className="flex items-center gap-2 text-sm">
              <Checkbox checked={row.required} onCheckedChange={(v) => update(i, { required: v === true })} />
              {t("suppRequired")}
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setRows((current) => current.filter((_, j) => j !== i))}
            >
              {t("suppRemove")}
            </Button>
          </div>
        </fieldset>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => setRows((r) => [...r, EMPTY])}>
        {t("suppAdd")}
      </Button>
      <LoadingButton type="submit" loading={put.isPending}>
        {t("suppSave")}
      </LoadingButton>
    </form>
  )
}

/** Pick a university and a cycle, then edit that cycle's supplemental essay prompts. */
export function SuppPromptsEditor({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT("catalogStaff")
  const [q, setQ] = useState("")
  const [target, setTarget] = useState<InstitutionHit | null>(null)
  const [cycle, setCycle] = useState(() => currentCycle(new Date()))
  const hits = useInstitutionSearch(target ? "" : q)
  const cycles = useSuppCycles(target?.id ?? null)
  const known = cycles.data?.map((c) => c.cycle) ?? []
  const validCycle = CYCLE.test(cycle)

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title={t("suppTitle")}>
      <div className="flex flex-col gap-4">
        {target ? (
          <div className="flex items-center justify-between gap-2 rounded-card border p-2 text-sm">
            <span>{target.name}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => setTarget(null)}>
              {t("clear")}
            </Button>
          </div>
        ) : (
          <>
            <Input
              aria-label={t("editLabel")}
              placeholder={t("editLabel")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {hits.data && hits.data.length === 0 && <p className="text-muted-foreground text-sm">{t("noResults")}</p>}
            <ul className="flex flex-col gap-1">
              {hits.data?.map((hit) => (
                <li key={hit.id}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setTarget(hit)}
                  >
                    {hit.name}
                  </Button>
                </li>
              ))}
            </ul>
          </>
        )}
        {target ? (
          <>
            <div className="flex flex-col gap-1">
              <Label htmlFor="supp-cycle">{t("suppCycle")}</Label>
              <Input
                id="supp-cycle"
                list="supp-cycles"
                value={cycle}
                aria-invalid={!validCycle}
                onChange={(e) => setCycle(e.target.value.trim())}
              />
              <datalist id="supp-cycles">
                {known.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            {cycles.isPending ? (
              <Skeleton className="h-24 w-full" />
            ) : validCycle ? (
              <CycleForm
                key={`${target.id}-${cycle}`}
                target={target}
                cycle={cycle}
                initial={rowsOf(cycles.data?.find((c) => c.cycle === cycle))}
                onDone={() => onOpenChange(false)}
              />
            ) : (
              <p className="text-destructive text-sm">{t("suppCycleError")}</p>
            )}
          </>
        ) : null}
      </div>
    </ResponsiveDialog>
  )
}
