"use client"

import {
  getAdminAiLimitsQuery,
  keys,
  putAdminAiLimits,
  type LimitItem,
  type LimitsBody,
  type LimitsResponse,
} from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { CheckField } from "../../shared/components/check-field"
import { QueryState } from "../../shared/components/query-state"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { LIMIT_GROUPS, limitNumber, UNLIMITED } from "../utils"

type Translate = ReturnType<typeof useT>

/** Limits in force, with the environment default, a reset and validation before a save. */
export function LimitsEditor() {
  const t = useT("limits")
  const query = useQuery(getAdminAiLimitsQuery())
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("editor.title")}</CardTitle>
        <p className="text-muted-foreground text-sm">{t("editor.description")}</p>
      </CardHeader>
      <CardContent>
        <QueryState query={query} rows={5}>
          {({ limits }) => <LimitsForm limits={limits} />}
        </QueryState>
      </CardContent>
    </Card>
  )
}

function toDraft(limits: LimitItem[]): Record<string, string> {
  return Object.fromEntries(limits.map((item) => [item.key, item.value === null ? "" : String(item.value)]))
}

function labelOf(t: Translate, item: LimitItem): string {
  const key = `fields.${item.key}.label`
  return t.has(key) ? t(`fields.${item.key}.label`) : item.key
}

function hintOf(t: Translate, item: LimitItem): string {
  const key = `fields.${item.key}.hint`
  return t.has(key) ? t(`fields.${item.key}.hint`) : item.description
}

/**
 * The changes a draft makes. An empty field resets an overridden limit to its environment value; a field
 * equal to the value in force changes nothing. Returns the body and the messages of the invalid fields.
 */
export function changesOf(
  limits: LimitItem[],
  draft: Record<string, string>,
  invalid: (item: LimitItem) => string,
): { body: LimitsBody; errors: Record<string, string> } {
  const changes: Record<string, number | null> = {}
  const errors: Record<string, string> = {}
  for (const item of limits) {
    const text = (draft[item.key] ?? "").trim()
    if (text === "") {
      if (item.overridden) changes[item.key] = null
      continue
    }
    const unlimited = item.unlimitable && text === String(UNLIMITED)
    const value = unlimited ? UNLIMITED : /^\d+$/.test(text) ? Number(text) : Number.NaN
    if (Number.isNaN(value) || (!unlimited && (value < item.minimum || value > item.maximum))) {
      errors[item.key] = invalid(item)
      continue
    }
    if (value !== item.value) changes[item.key] = value
  }
  return { body: { limits: changes }, errors }
}

function LimitsForm({ limits: initial }: { limits: LimitItem[] }) {
  const t = useT("limits")
  const f = useFormatters()
  const [items, setItems] = useState(initial)
  const [draft, setDraft] = useState(() => toDraft(initial))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const invalid = (item: LimitItem) => t("editor.invalid", { min: item.minimum, max: item.maximum })
  const pending = changesOf(items, draft, invalid)
  const changed = Object.keys(pending.body.limits).length
  const save = useAdminMutation<LimitsBody, LimitsResponse>({
    mutationFn: (body) => putAdminAiLimits(body),
    invalidate: [keys.admin.aiLimits()],
    success: t("editor.saved"),
    inlineError: true,
    onSuccess: (data) => {
      setItems(data.limits)
      setDraft(toDraft(data.limits))
      setErrors({})
    },
  })

  function submit() {
    const next = changesOf(items, draft, invalid)
    setErrors(next.errors)
    if (Object.keys(next.errors).length > 0 || Object.keys(next.body.limits).length === 0) return
    save.mutate(next.body)
  }

  return (
    <div className="flex flex-col gap-6">
      {LIMIT_GROUPS.map((group) => {
        const rows = items.filter((item) => item.group === group)
        if (rows.length === 0) return null
        return (
          <section key={group} aria-labelledby={`limits-${group}`} className="flex flex-col">
            <h3 id={`limits-${group}`} className="text-sm font-semibold">
              {t(`editor.groups.${group}`)}
            </h3>
            <ul className="flex flex-col">
              {rows.map((item) => (
                <li key={item.key} className="grid gap-2 border-b py-3 sm:grid-cols-[1fr_auto] sm:items-start">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <Label htmlFor={`limit-${item.key}`} className="text-sm">
                      {labelOf(t, item)}
                    </Label>
                    <p className="text-muted-foreground text-xs">{hintOf(t, item)}</p>
                    <p className="text-muted-foreground text-xs tabular-nums">
                      {t("editor.default", { value: limitNumber(item.default, f.locale) })}
                      {unitText(t, item) ? ` · ${unitText(t, item)}` : ""}
                      {item.overridden ? ` · ${t("editor.changed")}` : ""}
                    </p>
                    {errors[item.key] ? (
                      <p role="alert" className="text-destructive text-xs">
                        {errors[item.key]}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {item.unit === "switch" ? (
                      <CheckField
                        checked={switchOf(draft, item)}
                        label={t("editor.on")}
                        className="min-h-0"
                        onChange={(on) => setDraft({ ...draft, [item.key]: on ? "1" : "0" })}
                      />
                    ) : null}
                    {item.unlimitable ? (
                      <CheckField
                        checked={unlimitedOf(draft, item)}
                        label={t("editor.unlimited")}
                        className="min-h-0"
                        onChange={(on) => setDraft({ ...draft, [item.key]: on ? String(UNLIMITED) : "" })}
                      />
                    ) : null}
                    <Input
                      id={`limit-${item.key}`}
                      hidden={item.unit === "switch"}
                      inputMode="numeric"
                      className="w-32 text-end tabular-nums"
                      value={unlimitedOf(draft, item) ? "∞" : (draft[item.key] ?? "")}
                      disabled={unlimitedOf(draft, item)}
                      placeholder={item.default === null ? "" : String(item.default)}
                      aria-invalid={Boolean(errors[item.key])}
                      onChange={(event) => setDraft({ ...draft, [item.key]: event.target.value })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={!item.overridden && (draft[item.key] ?? "") === ""}
                      onClick={() => setDraft({ ...draft, [item.key]: "" })}
                    >
                      {t("editor.reset")}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
      <div className="flex flex-wrap items-center justify-end gap-3">
        {changed === 0 ? <span className="text-muted-foreground text-sm">{t("editor.unchanged")}</span> : null}
        {save.isError ? (
          <span role="alert" className="text-destructive text-sm">
            {t("editor.failed")}
          </span>
        ) : null}
        <Button type="button" onClick={submit} disabled={save.isPending || changed === 0}>
          {t("editor.save")}
        </Button>
      </div>
    </div>
  )
}

/** True when the draft of a limit is "no cap" (only a limit that allows it can be). */
function unlimitedOf(draft: Record<string, string>, item: LimitItem): boolean {
  return item.unlimitable && draft[item.key] === String(UNLIMITED)
}

/** The state of a 0/1 switch limit: the draft, else the value in force. */
function switchOf(draft: Record<string, string>, item: LimitItem): boolean {
  const text = draft[item.key] ?? ""
  return (text === "" ? String(item.value ?? item.default ?? 0) : text) === "1"
}

function unitText(t: Translate, item: LimitItem): string {
  const unit = item.unit && item.unit !== "count" && item.unit !== "switch" ? t(`editor.unit.${item.unit}`) : ""
  const period = item.period ? t(`editor.period.${item.period}`) : ""
  return [unit, period].filter(Boolean).join(" ")
}
