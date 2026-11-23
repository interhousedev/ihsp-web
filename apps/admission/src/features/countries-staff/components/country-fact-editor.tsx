"use client"

import { useT } from "@ihsp/i18n"
import {
  Button,
  Icons,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  cn,
} from "@ihsp/ui"
import { UrlListField } from "../../../components/lib/url-list-field"
import {
  EMPLOYERS_MAX,
  ENTRIES,
  FIXED_SCORES,
  OPPORTUNITY_FIELDS,
  SOURCES_MAX,
  CURRENCIES,
  humanize,
  type Built,
  type Draft,
  type EditKey,
  type Entry,
  type Row,
} from "../country-values"

const TRIGGER = "min-h-11 w-full md:min-h-8"

function Pill({
  pressed,
  onClick,
  children,
  label,
}: {
  pressed: boolean
  onClick: () => void
  children: string
  label?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "min-h-9 min-w-9 rounded-full border px-3 text-sm md:min-h-7 md:px-2.5 md:text-[13px]",
        pressed ? "border-primary bg-primary/10 text-primary font-medium" : "bg-card text-muted-foreground",
      )}
    >
      {children}
    </button>
  )
}

/** 1-5 score as pills; pressing the active one clears it. */
function Scale({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {["1", "2", "3", "4", "5"].map((n) => (
        <Pill key={n} pressed={value === n} onClick={() => onChange(value === n ? "" : n)}>
          {n}
        </Pill>
      ))}
    </div>
  )
}

function Pick({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <Select value={value || null} onValueChange={(next) => onChange(next ?? "")}>
      <SelectTrigger aria-label={label} className={TRIGGER}>
        <SelectValue>{(v: string | null) => options.find((o) => o.value === v)?.label ?? v}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function ValueRows({ k, draft, patch }: { k: EditKey; draft: Draft; patch: (p: Partial<Draft>) => void }) {
  const t = useT("countries")
  const u = useT("settingsUx")
  const entries = ENTRIES[k] ?? []
  const label = (e: Entry | undefined, other?: string) => (e ? t(`values.label.${e.id}`) : humanize(other ?? ""))
  const setRow = (i: number, next: Partial<Row>) =>
    patch({
      rows: draft.rows.map((r, j) => (j === i ? { ...r, ...next } : r)),
    })
  const free = entries.filter((e) => !draft.rows.some((r) => r.entry === e.id))
  const period = (e: Entry | undefined) => (e?.kind === "money" && e.period ? u(`period.${e.period}`) : null)
  return (
    <div className="flex flex-col gap-2">
      {draft.rows.map((r, i) => {
        const e = entries.find((x) => x.id === r.entry)
        const name = label(e, r.other)
        return (
          <div key={`${r.entry}${r.other ?? ""}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-muted-foreground text-xs">
                {name}
                {period(e) ? ` · ${period(e)}` : ""}
              </span>
              <div className="flex gap-2">
                {e?.kind === "bool" || (!e && (r.value === "yes" || r.value === "no")) ? (
                  <div role="group" aria-label={name} className="flex flex-wrap gap-1.5">
                    {(["yes", "no"] as const).map((v) => (
                      <Pill key={v} pressed={r.value === v} onClick={() => setRow(i, { value: v })}>
                        {t(`values.unit.${v}`)}
                      </Pill>
                    ))}
                  </div>
                ) : (
                  <>
                    <Input
                      type={e?.kind === "text" ? "text" : "number"}
                      inputMode={e?.kind === "text" ? undefined : "decimal"}
                      step="any"
                      min={e?.kind === "money" ? 0 : undefined}
                      maxLength={e?.kind === "text" ? 300 : undefined}
                      aria-label={name}
                      value={r.value}
                      onChange={(ev) => setRow(i, { value: ev.target.value })}
                    />
                    {e?.kind === "money" ? (
                      <div className="w-28 shrink-0">
                        <Pick
                          label={u("currency", { label: name })}
                          value={r.cur}
                          options={CURRENCIES.map((c) => ({
                            value: c,
                            label: c.toUpperCase(),
                          }))}
                          onChange={(cur) =>
                            // A currency already used by the same entry would clash; keep the old one.
                            draft.rows.some((o, j) => j !== i && o.entry === r.entry && o.cur === cur)
                              ? undefined
                              : setRow(i, { cur })
                          }
                        />
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="min-h-11 min-w-11 md:min-h-8 md:min-w-8"
              aria-label={u("removeValue", { label: name })}
              onClick={() => patch({ rows: draft.rows.filter((_, j) => j !== i) })}
            >
              <Icons.trash className="size-4" />
            </Button>
          </div>
        )
      })}
      {free.length > 0 || entries.some((e) => e.kind === "money") ? (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={u("addValue")}>
          {entries
            .filter((e) => e.kind === "money" || free.includes(e))
            .filter(
              (e) =>
                e.kind !== "money" || CURRENCIES.some((c) => !draft.rows.some((r) => r.entry === e.id && r.cur === c)),
            )
            .map((e) => (
              <Button
                key={e.id}
                type="button"
                variant="outline"
                size="sm"
                className="min-h-11 md:min-h-8"
                onClick={() => {
                  const used = draft.rows.filter((r) => r.entry === e.id).map((r) => r.cur)
                  const cur = e.kind === "money" ? (CURRENCIES.find((c) => !used.includes(c)) ?? "usd") : ""
                  patch({
                    rows: [
                      ...draft.rows,
                      {
                        entry: e.id,
                        cur,
                        value: e.kind === "bool" ? "yes" : "",
                      },
                    ],
                  })
                }}
              >
                + {t(`values.label.${e.id}`)}
              </Button>
            ))}
        </div>
      ) : null}
    </div>
  )
}

function Employers({ draft, patch }: { draft: Draft; patch: (p: Partial<Draft>) => void }) {
  const t = useT("countries")
  const u = useT("settingsUx")
  const set = (fk: string, list: Draft["employers"][string]) => patch({ employers: { ...draft.employers, [fk]: list } })
  return (
    <div className="flex flex-col gap-3">
      {OPPORTUNITY_FIELDS.map((fk) => {
        const list = draft.employers[fk] ?? []
        const fieldName = t(`field.${fk}`)
        return (
          <div key={fk} role="group" aria-label={fieldName} className="flex flex-col gap-2 rounded-card border p-2">
            <span className="text-sm font-medium">{fieldName}</span>
            {list.map((e, i) => {
              const at = (next: Partial<typeof e>) =>
                set(
                  fk,
                  list.map((x, j) => (j === i ? { ...x, ...next } : x)),
                )
              const n = `${fieldName} ${i + 1}`
              return (
                <div key={i} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                  <div className="grid min-w-0 gap-2 sm:grid-cols-3">
                    <Input
                      aria-label={u("employerName", { n })}
                      placeholder={u("employerNamePh")}
                      maxLength={120}
                      value={e.name}
                      onChange={(ev) => at({ name: ev.target.value })}
                    />
                    <Input
                      aria-label={u("employerSector", { n })}
                      placeholder={u("employerSectorPh")}
                      maxLength={80}
                      value={e.sector}
                      onChange={(ev) => at({ sector: ev.target.value })}
                    />
                    <Input
                      type="url"
                      inputMode="url"
                      aria-label={u("employerUrl", { n })}
                      placeholder="https://"
                      maxLength={500}
                      value={e.url}
                      onChange={(ev) => at({ url: ev.target.value })}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="min-h-11 min-w-11 md:min-h-8 md:min-w-8"
                    aria-label={u("removeEmployer", { n })}
                    onClick={() =>
                      set(
                        fk,
                        list.filter((_, j) => j !== i),
                      )
                    }
                  >
                    <Icons.trash className="size-4" />
                  </Button>
                </div>
              )
            })}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11 self-start md:min-h-8"
              disabled={list.length >= EMPLOYERS_MAX}
              onClick={() => set(fk, [...list, { name: "", sector: "", url: "" }])}
            >
              {u("addEmployer")}
            </Button>
          </div>
        )
      })}
    </div>
  )
}

function Salaries({ draft, patch }: { draft: Draft; patch: (p: Partial<Draft>) => void }) {
  const t = useT("countries")
  const u = useT("settingsUx")
  const s = draft.salary
  const set = (next: Partial<typeof s>) => patch({ salary: { ...s, ...next } })
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-xs">
        {u("salaryCurrency")}
        <Input readOnly value="USD" />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        {u("salaryYear")}
        <Input
          type="number"
          inputMode="numeric"
          min={2000}
          max={2100}
          value={s.year}
          onChange={(e) => set({ year: e.target.value })}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs sm:col-span-2">
        {u("salaryOverall")}
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          value={s.overall}
          onChange={(e) => set({ overall: e.target.value })}
        />
      </label>
      {OPPORTUNITY_FIELDS.map((fk) => (
        <label key={fk} className="flex flex-col gap-1 text-xs">
          {t(`field.${fk}`)}
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            value={s.by[fk] ?? ""}
            onChange={(e) => set({ by: { ...s.by, [fk]: e.target.value } })}
          />
        </label>
      ))}
    </div>
  )
}

/** Everything staff can enter for one country fact: overall score, typed numbers, localized text and source links. */
export function FactEditor({
  k,
  draft,
  built,
  onChange,
}: {
  k: EditKey
  draft: Draft
  built: Built
  onChange: (next: Draft) => void
}) {
  const t = useT("countries")
  const u = useT("settingsUx")
  const patch = (p: Partial<Draft>) => onChange({ ...draft, ...p })
  const fixed = FIXED_SCORES[k]
  const nested = k === "employers" || k === "salaries"
  return (
    <div className="flex flex-col gap-3">
      {nested ? null : (
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">{t("overall")}</span>
          <Scale
            label={`${u(`title.${k}`)} ${t("overall")}`}
            value={draft.score}
            onChange={(score) => patch({ score })}
          />
        </div>
      )}
      {fixed ? (
        <div className="flex flex-col gap-2">
          {fixed.map((name) => (
            <div key={name} className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs">
                {t(k === "opportunities" ? `field.${name}` : `values.label.${name}`)}
              </span>
              <Scale
                label={t(k === "opportunities" ? `field.${name}` : `values.label.${name}`)}
                value={draft.scores[name] ?? ""}
                onChange={(v) => patch({ scores: { ...draft.scores, [name]: v } })}
              />
            </div>
          ))}
        </div>
      ) : k === "employers" ? (
        <Employers draft={draft} patch={patch} />
      ) : k === "salaries" ? (
        <Salaries draft={draft} patch={patch} />
      ) : (
        <ValueRows k={k} draft={draft} patch={patch} />
      )}
      {(["en", "ru", "uz"] as const).map((l) => (
        <label key={l} className="flex flex-col gap-1 text-xs">
          {u("text", { lang: l.toUpperCase() })}
          <Textarea
            rows={2}
            maxLength={1500}
            value={draft.text[l]}
            onChange={(e) => patch({ text: { ...draft.text, [l]: e.target.value } })}
          />
        </label>
      ))}
      <UrlListField
        label={u("sources")}
        value={draft.sources}
        onChange={(sources) => patch({ sources })}
        max={SOURCES_MAX}
        required={built.problems.includes("sourceRequired")}
        requiredText={u("sourceRequired")}
      />
      {built.problems
        .filter((p) => p !== "source" && p !== "sourceRequired")
        .map((p) => (
          <p key={p} role="alert" className="text-destructive text-xs">
            {u(`problem.${p}`)}
          </p>
        ))}
    </div>
  )
}
