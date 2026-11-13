"use client"

import type { AdminHonoursRules, HonoursMaxFoursRule } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, RegistryIcon } from "@ihsp/ui"
import { useState } from "react"
import { CheckField } from "../../shared/components/check-field"
import { TOUCH } from "../../shared/utils/touch"

export const HONOURS_MAX_FOURS_LIMIT = 20
const SERIAL_MAX = 32

/** The backend's rules when none are saved (the lyceum's own). */
export const DEFAULT_HONOURS: AdminHonoursRules = {
  red_diploma_max_fours: { enabled: true, max: 1 },
  medal_certificate: { enabled: true, serials: ["TM-A", "TMA"] },
  gold_controls_all_five: { enabled: true },
  gold_semester_all_five: { enabled: true },
  silver_controls_all_five: { enabled: false },
  silver_semester_max_fours: { enabled: true, max: 1 },
}

type MaxFoursKey = "red_diploma_max_fours" | "silver_semester_max_fours"
type FlagKey = "gold_controls_all_five" | "gold_semester_all_five" | "silver_controls_all_five"

export function isValidMax(max: number): boolean {
  return Number.isInteger(max) && max >= 0 && max <= HONOURS_MAX_FOURS_LIMIT
}

/** True when the backend would accept these rules. */
export function honoursValid(rules: AdminHonoursRules): boolean {
  const { medal_certificate: certificate } = rules
  return (
    (!rules.red_diploma_max_fours.enabled || isValidMax(rules.red_diploma_max_fours.max)) &&
    (!rules.silver_semester_max_fours.enabled || isValidMax(rules.silver_semester_max_fours.max)) &&
    (!certificate.enabled || certificate.serials.length > 0)
  )
}

function MaxFoursRule({
  id,
  label,
  rule,
  fallbackMax,
  onChange,
}: {
  id: string
  label: string
  rule: HonoursMaxFoursRule
  fallbackMax: number
  onChange: (rule: HonoursMaxFoursRule) => void
}) {
  const t = useT("settings.honours")
  const invalid = rule.enabled && !isValidMax(rule.max)
  const errorId = `${id}-error`
  return (
    <div className="grid gap-2">
      <CheckField
        checked={rule.enabled}
        // A switched-off rule keeps a sendable number, so an emptied field never reaches the API as null.
        onChange={(enabled) =>
          onChange({ ...rule, enabled, max: !enabled && !isValidMax(rule.max) ? fallbackMax : rule.max })
        }
        label={label}
      />
      <div className="grid gap-1 pl-6">
        <label htmlFor={id} className="text-muted-foreground text-xs">
          {t("maxFours")}
        </label>
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={0}
          max={HONOURS_MAX_FOURS_LIMIT}
          step={1}
          disabled={!rule.enabled}
          aria-invalid={invalid}
          aria-describedby={invalid ? errorId : undefined}
          value={Number.isNaN(rule.max) ? "" : rule.max}
          className={`${TOUCH} w-28`}
          onChange={(event) =>
            onChange({ ...rule, max: event.target.value === "" ? Number.NaN : Number(event.target.value) })
          }
        />
        {invalid ? (
          <p id={errorId} role="alert" className="text-destructive text-xs">
            {t("maxInvalid", { max: HONOURS_MAX_FOURS_LIMIT })}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function SerialsRule({
  enabled,
  serials,
  onChange,
}: {
  enabled: boolean
  serials: string[]
  onChange: (rule: { enabled: boolean; serials: string[] }) => void
}) {
  const t = useT("settings.honours")
  const [draft, setDraft] = useState("")
  const value = draft.trim()
  const duplicate = value !== "" && serials.some((serial) => serial.toLowerCase() === value.toLowerCase())
  const add = () => {
    if (!enabled || !value || duplicate) return
    onChange({ enabled, serials: [...serials, value] })
    setDraft("")
  }
  const emptyShown = enabled && serials.length === 0
  const describedBy = duplicate ? "honours-serial-duplicate" : emptyShown ? "honours-serials-empty" : undefined
  return (
    <div className="grid gap-2">
      <CheckField
        checked={enabled}
        onChange={(next) => onChange({ enabled: next, serials })}
        label={t("rules.medal_certificate")}
      />
      <div className="grid gap-2 pl-6">
        <span className="text-muted-foreground text-xs">{t("serials")}</span>
        <ul className="flex flex-wrap gap-2" aria-label={t("serials")}>
          {serials.map((serial) => (
            <li key={serial}>
              <Badge variant="secondary" className="gap-1">
                {serial}
                <button
                  type="button"
                  disabled={!enabled}
                  className="-my-2.5 -mr-1 inline-flex size-11 items-center justify-center rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 md:m-0 md:size-6"
                  aria-label={t("removeSerial", { serial })}
                  onClick={() => onChange({ enabled, serials: serials.filter((item) => item !== serial) })}
                >
                  <RegistryIcon name="close" className="mx-auto" />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
        {emptyShown ? (
          <p id="honours-serials-empty" role="alert" className="text-destructive text-xs">
            {t("serialsEmpty")}
          </p>
        ) : null}
        <div className="flex gap-2">
          <Input
            value={draft}
            maxLength={SERIAL_MAX}
            disabled={!enabled}
            aria-label={t("newSerial")}
            aria-invalid={duplicate || emptyShown}
            aria-describedby={describedBy}
            className={TOUCH}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={add}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                add()
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            className={TOUCH}
            disabled={!enabled || !value || duplicate}
            onClick={add}
          >
            <RegistryIcon name="add" />
            {t("addSerial")}
          </Button>
        </div>
        {duplicate ? (
          <p id="honours-serial-duplicate" role="alert" className="text-destructive text-xs">
            {t("serialDuplicate")}
          </p>
        ) : null}
      </div>
    </div>
  )
}

/** The honours rules (red diploma, gold and silver medals): a switch per rule, the limits and the certificate serials. */
export function HonoursSection({
  value,
  onChange,
}: {
  value: AdminHonoursRules
  onChange: (value: AdminHonoursRules) => void
}) {
  const t = useT("settings.honours")
  const flag = (key: FlagKey) => (
    <CheckField
      key={key}
      checked={value[key].enabled}
      onChange={(enabled) => onChange({ ...value, [key]: { enabled } })}
      label={t(`rules.${key}`)}
    />
  )
  const maxFours = (key: MaxFoursKey) => (
    <MaxFoursRule
      id={`honours-${key}`}
      label={t(`rules.${key}`)}
      rule={value[key]}
      fallbackMax={DEFAULT_HONOURS[key].max}
      onChange={(rule) => onChange({ ...value, [key]: rule })}
    />
  )
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        <section className="grid gap-3" aria-labelledby="honours-red">
          <h3 id="honours-red" className="text-sm font-semibold">
            {t("awards.red_diploma")}
          </h3>
          {maxFours("red_diploma_max_fours")}
        </section>
        <section className="grid gap-3" aria-labelledby="honours-gold">
          <h3 id="honours-gold" className="text-sm font-semibold">
            {t("awards.gold_medal")}
          </h3>
          {flag("gold_controls_all_five")}
          {flag("gold_semester_all_five")}
        </section>
        <section className="grid gap-3" aria-labelledby="honours-silver">
          <h3 id="honours-silver" className="text-sm font-semibold">
            {t("awards.silver_medal")}
          </h3>
          {flag("silver_controls_all_five")}
          {maxFours("silver_semester_max_fours")}
        </section>
        <section className="grid gap-3" aria-labelledby="honours-certificate">
          <h3 id="honours-certificate" className="text-sm font-semibold">
            {t("awards.certificate")}
          </h3>
          <SerialsRule
            enabled={value.medal_certificate.enabled}
            serials={value.medal_certificate.serials}
            onChange={(rule) => onChange({ ...value, medal_certificate: rule })}
          />
        </section>
      </CardContent>
    </Card>
  )
}
