"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Checkbox, Input, LoadingButton, ResponsiveDialog, Skeleton, TagInput } from "@ihsp/ui"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { UnderlineTabs, type UnderlineTab } from "../../../components/lib/underline-tabs"
import { useFactSpec } from "../api"
import {
  useCard,
  useCardMutations,
  type Card,
  type CardFactInput,
  type CardScholarship,
  type ScholarshipInput,
} from "../card-api"
import { buildFacts, currentYear, factsFromRows, isHttpsUrl, serializeDraft, type FactsState } from "../fact-draft"
import type { StaffInstitution } from "../universities-api"
import { FactsStep } from "./facts-step"
import { UniversityEditDialog } from "./university-edit-dialog"

const TABS = ["basics", "facts", "scholarships", "description"] as const
const TAB_ICON: Record<(typeof TABS)[number], UnderlineTab["icon"]> = {
  basics: "info",
  facts: "checks",
  scholarships: "billing",
  description: "text",
}
const LOCALES = ["uz", "ru", "en"] as const
const PROVIDERS = ["institution", "government", "foundation"] as const
const BASES = ["merit", "need", "government", "sports", "work_study"] as const
const MAP_KEY = "map_url"
const field = "flex flex-col gap-1 text-sm"
const select = "border-input bg-background h-10 w-full rounded-md border px-3 text-sm"

function BasicsTab({ institution, card }: { institution: StaffInstitution; card: Card }) {
  const t = useT("catalogCard")
  const errorMessage = useErrorMessage()
  const { saveFacts } = useCardMutations(institution.id)
  const stored = card.facts.find((f) => f.key === MAP_KEY)
  const [url, setUrl] = useState(typeof stored?.value === "string" ? stored.value : "")
  const [editing, setEditing] = useState(false)
  const clean = url.trim()
  const valid = clean === "" || isHttpsUrl(clean)

  async function save() {
    try {
      await saveFacts.mutateAsync(
        clean === ""
          ? { lock_version: card.lock_version, facts: {}, remove: [MAP_KEY] }
          : {
              lock_version: card.lock_version,
              facts: {
                [MAP_KEY]: {
                  value: clean,
                  source_url: clean,
                  year: Number(currentYear()),
                  verified: true,
                },
              },
              remove: [],
            },
      )
      toast.success(t("saved"))
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">{institution.name}</span>
        <span className="text-muted-foreground text-xs">
          {[institution.country, institution.city, institution.website_domain].filter(Boolean).join(" · ")}
        </span>
        <Button type="button" variant="outline" className="mt-2 self-start" onClick={() => setEditing(true)}>
          {t("editBasics")}
        </Button>
        <UniversityEditDialog open={editing} institution={institution} onClose={() => setEditing(false)} />
      </div>
      <label className={field}>
        {t("mapUrl")}
        <Input
          type="url"
          inputMode="url"
          placeholder="https://"
          maxLength={2000}
          aria-invalid={!valid || undefined}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <span className="text-muted-foreground text-xs">{t("mapUrlHint")}</span>
      </label>
      <LoadingButton
        type="button"
        className="self-start"
        loading={saveFacts.isPending}
        disabled={!valid}
        onClick={save}
      >
        {t("save")}
      </LoadingButton>
    </div>
  )
}

function FactsTab({ institution, card }: { institution: StaffInstitution; card: Card }) {
  const t = useT("catalogCard")
  const errorMessage = useErrorMessage()
  const spec = useFactSpec()
  const { saveFacts } = useCardMutations(institution.id)
  const groups = (spec.data?.groups ?? [])
    .map((group) => ({
      ...group,
      facts: group.facts.filter((item) => item.key !== MAP_KEY),
    }))
    .filter((group) => group.facts.length > 0)
  const [state, setState] = useState<FactsState | null>(null)
  const [baseline, setBaseline] = useState<FactsState | null>(null)
  const [open, setOpen] = useState<string[]>([])
  const [verified, setVerified] = useState(true)

  useEffect(() => {
    if (!spec.data) return
    const seeded = factsFromRows(spec.data.groups, card.facts)
    setState(seeded)
    setBaseline(seeded)
  }, [spec.data, card.facts])

  if (!state || !baseline) return <Skeleton className="h-48 w-full" />
  const built = buildFacts(groups, state, baseline)
  const specs = groups.flatMap((group) => group.facts)
  const remove = Object.keys(baseline.facts).filter((k) =>
    specs.some((item) => item.key === k && serializeDraft(item, state.facts[k]?.draft) === undefined),
  )
  const changed = Object.keys(built.facts).length + remove.length

  async function save() {
    const facts: Record<string, CardFactInput> = Object.fromEntries(
      Object.entries(built.facts).map(([k, f]) => [k, { ...f, verified }]),
    )
    try {
      await saveFacts.mutateAsync({
        lock_version: card.lock_version,
        facts,
        remove,
      })
      toast.success(t("saved"))
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <FactsStep
        groups={groups}
        state={state}
        open={open}
        error={null}
        errorText=""
        onOpenChange={setOpen}
        onChange={setState}
      />
      {built.incomplete.length > 0 && <p className="text-destructive text-xs">{t("incomplete")}</p>}
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <Checkbox checked={verified} onCheckedChange={(v) => setVerified(v === true)} />
        {t("verified")}
      </label>
      <LoadingButton
        type="button"
        className="self-start"
        loading={saveFacts.isPending}
        disabled={changed === 0 || built.incomplete.length > 0}
        onClick={save}
      >
        {t("saveFacts", { count: changed })}
      </LoadingButton>
    </div>
  )
}

type SForm = {
  name: string
  provider: string
  basis: string
  country: string
  min: string
  max: string
  covers: string[]
  url: string
  cycle: string
}

const S_EMPTY: SForm = {
  name: "",
  provider: "institution",
  basis: "merit",
  country: "",
  min: "",
  max: "",
  covers: [],
  url: "",
  cycle: "",
}

const toS = (s: CardScholarship): SForm => ({
  name: s.name,
  provider: s.provider,
  basis: s.basis,
  country: s.country ?? "",
  min: s.coverage_pct_min?.toString() ?? "",
  max: s.coverage_pct_max?.toString() ?? "",
  covers: [...s.covers],
  url: s.url ?? "",
  cycle: s.cycle?.toString() ?? "",
})

function toInput(f: SForm): ScholarshipInput {
  const n = (v: string) => (v.trim() === "" ? null : Number(v))
  return {
    name: f.name.trim(),
    provider: f.provider as ScholarshipInput["provider"],
    basis: f.basis as ScholarshipInput["basis"],
    country: f.country.trim().toUpperCase() || null,
    coverage_pct_min: n(f.min),
    coverage_pct_max: n(f.max),
    covers: f.covers,
    url: f.url.trim() || null,
    cycle: n(f.cycle),
  }
}

function ScholarshipsTab({ institution, card }: { institution: StaffInstitution; card: Card }) {
  const t = useT("catalogCard")
  const u = useT("settingsUx")
  const errorMessage = useErrorMessage()
  const m = useCardMutations(institution.id)
  const [editing, setEditing] = useState<{
    id: string | null
    form: SForm
  } | null>(null)
  const set = (patch: Partial<SForm>) => setEditing((e) => (e ? { ...e, form: { ...e.form, ...patch } } : e))

  async function run(action: Promise<unknown>) {
    try {
      await action
      setEditing(null)
      toast.success(t("saved"))
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const lock = card.lock_version
  const urlOk = editing === null || editing.form.url.trim() === "" || isHttpsUrl(editing.form.url)
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {card.scholarships.map((s) => (
          <li key={s.id} className="bg-card flex flex-wrap items-center gap-2 rounded-card border p-3">
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">{s.name}</span>
              <span className="text-muted-foreground text-xs">
                {t(`providers.${s.provider}`)} · {t(`bases.${s.basis}`)}
                {s.coverage_pct_max !== null ? ` · ${s.coverage_pct_min ?? 0}-${s.coverage_pct_max}%` : ""}
              </span>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setEditing({ id: s.id, form: toS(s) })}>
              {t("edit")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={m.deleteScholarship.isPending}
              onClick={() =>
                run(
                  m.deleteScholarship.mutateAsync({
                    sid: s.id,
                    lock_version: lock,
                  }),
                )
              }
            >
              {t("delete")}
            </Button>
          </li>
        ))}
        {card.scholarships.length === 0 && <li className="text-muted-foreground text-sm">{t("noScholarships")}</li>}
      </ul>
      {editing === null ? (
        <Button
          type="button"
          variant="outline"
          className="self-start"
          onClick={() => setEditing({ id: null, form: S_EMPTY })}
        >
          {t("addScholarship")}
        </Button>
      ) : (
        <form
          className="grid gap-3 rounded-card border p-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            const body = toInput(editing.form)
            void run(
              editing.id
                ? m.updateScholarship.mutateAsync({
                    ...body,
                    sid: editing.id,
                    lock_version: lock,
                  })
                : m.createScholarship.mutateAsync({
                    ...body,
                    lock_version: lock,
                  }),
            )
          }}
        >
          <label className={`${field} sm:col-span-2`}>
            {t("sName")}
            <Input value={editing.form.name} maxLength={200} onChange={(e) => set({ name: e.target.value })} />
          </label>
          <label className={field}>
            {t("sProvider")}
            <select
              className={select}
              value={editing.form.provider}
              onChange={(e) => set({ provider: e.target.value })}
            >
              {PROVIDERS.map((p) => (
                <option key={p} value={p}>
                  {t(`providers.${p}`)}
                </option>
              ))}
            </select>
          </label>
          <label className={field}>
            {t("sBasis")}
            <select className={select} value={editing.form.basis} onChange={(e) => set({ basis: e.target.value })}>
              {BASES.map((b) => (
                <option key={b} value={b}>
                  {t(`bases.${b}`)}
                </option>
              ))}
            </select>
          </label>
          <label className={field}>
            {t("sCoverageMin")}
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              value={editing.form.min}
              onChange={(e) => set({ min: e.target.value })}
            />
          </label>
          <label className={field}>
            {t("sCoverageMax")}
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              value={editing.form.max}
              onChange={(e) => set({ max: e.target.value })}
            />
          </label>
          <label className={field}>
            {t("sCountry")}
            <Input value={editing.form.country} maxLength={2} onChange={(e) => set({ country: e.target.value })} />
          </label>
          <label className={field}>
            {t("sCycle")}
            <Input
              type="number"
              inputMode="numeric"
              value={editing.form.cycle}
              onChange={(e) => set({ cycle: e.target.value })}
            />
          </label>
          <div className={`${field} sm:col-span-2`}>
            <label htmlFor="sch-covers">{t("sCovers")}</label>
            <TagInput
              id="sch-covers"
              value={editing.form.covers}
              onChange={(covers) => set({ covers })}
              max={12}
              maxLength={60}
              placeholder={u("coversPlaceholder")}
              removeLabel={(tag) => u("removeTag", { tag })}
            />
          </div>
          <label className={`${field} sm:col-span-2`}>
            {t("sUrl")}
            <Input
              type="url"
              inputMode="url"
              placeholder="https://"
              maxLength={2000}
              aria-invalid={!urlOk || undefined}
              value={editing.form.url}
              onChange={(e) => set({ url: e.target.value })}
            />
            {!urlOk ? (
              <span role="alert" className="text-destructive text-xs">
                {u("urlInvalid")}
              </span>
            ) : null}
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <LoadingButton
              type="submit"
              loading={m.createScholarship.isPending || m.updateScholarship.isPending}
              disabled={editing.form.name.trim() === "" || !urlOk}
            >
              {t("save")}
            </LoadingButton>
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
              {t("cancel")}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

function DescriptionTab({ institution, card }: { institution: StaffInstitution; card: Card }) {
  const t = useT("catalogCard")
  const errorMessage = useErrorMessage()
  const { saveDescription } = useCardMutations(institution.id)
  const [text, setText] = useState<Record<string, string>>({})
  useEffect(() => setText({ uz: "", ru: "", en: "", ...card.description }), [card.description])

  async function save() {
    try {
      await saveDescription.mutateAsync({
        lock_version: card.lock_version,
        description: text,
      })
      toast.success(t("saved"))
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {LOCALES.map((loc) => (
        <label key={loc} className={field}>
          {t(`locales.${loc}`)}
          <textarea
            className="border-input bg-background min-h-28 w-full rounded-md border p-3 text-sm"
            maxLength={2000}
            value={text[loc] ?? ""}
            onChange={(e) => setText((current) => ({ ...current, [loc]: e.target.value }))}
          />
          <span className="text-muted-foreground text-xs">{(text[loc] ?? "").length} / 2000</span>
        </label>
      ))}
      <LoadingButton type="button" className="self-start" loading={saveDescription.isPending} onClick={save}>
        {t("save")}
      </LoadingButton>
    </div>
  )
}

/** Curator editor of one institution's card: basics, facts, scholarships and the description per language. */
export function CardDialog({ institution, onClose }: { institution: StaffInstitution | null; onClose: () => void }) {
  const t = useT("catalogCard")
  const [tab, setTab] = useState<(typeof TABS)[number]>("basics")
  const card = useCard(institution?.id ?? null)
  return (
    <ResponsiveDialog
      open={institution !== null}
      onOpenChange={(o) => !o && onClose()}
      title={institution?.name ?? ""}
      size="lg"
    >
      <div className="flex flex-col gap-4">
        <UnderlineTabs
          label={t("title")}
          tabs={TABS.map((value) => ({ value, label: t(`tabs.${value}`), icon: TAB_ICON[value] }))}
          value={tab}
          onValueChange={(next) => setTab(next as (typeof TABS)[number])}
        />
        {institution === null ? null : card.isPending ? (
          <Skeleton className="h-48 w-full" />
        ) : card.isError ? (
          <Button variant="outline" onClick={() => card.refetch()}>
            {t("retry")}
          </Button>
        ) : (
          <>
            {tab === "basics" && <BasicsTab institution={institution} card={card.data} />}
            {tab === "facts" && <FactsTab institution={institution} card={card.data} />}
            {tab === "scholarships" && <ScholarshipsTab institution={institution} card={card.data} />}
            {tab === "description" && <DescriptionTab institution={institution} card={card.data} />}
          </>
        )}
      </div>
    </ResponsiveDialog>
  )
}
