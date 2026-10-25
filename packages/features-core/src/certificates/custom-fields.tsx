"use client"

import type { CertificateFilters, CertificateType, CustomField, CustomValue } from "@ihsp/api"
import { getCustomFieldValuesQuery } from "@ihsp/api"
import { useLocale, useT } from "@ihsp/i18n"
import { Checkbox, Dropdown, Field, FieldLabel, Input } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { type ReactNode, useState } from "react"

/** The field's label in the active locale, falling back to English. */
export function customFieldLabel(field: CustomField, locale: string): string {
  const labels = field.label as Record<string, string | undefined>
  return labels[locale] || field.label.en || field.key
}

const OTHER = "__other__"
const SEPARATOR = "──────────"
const SEPARATOR_VALUE = "__separator__"

/** Student form inputs for a type's custom fields: text, number, one or several choices, optional free text. */
export function CustomFieldInputs({
  fields,
  values,
  onChange,
}: {
  fields: CustomField[]
  values: Record<string, CustomValue>
  onChange: (values: Record<string, CustomValue>) => void
}) {
  const t = useT("certificates")
  const locale = useLocale()
  const set = (key: string, value: CustomValue | undefined) => {
    const next = { ...values }
    if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) delete next[key]
    else next[key] = value
    onChange(next)
  }
  return (
    <>
      {fields.map((field) => {
        const id = `cf-${field.key}`
        const label = (
          <FieldLabel htmlFor={id}>
            {customFieldLabel(field, locale)}
            {field.required ? " *" : ""}
          </FieldLabel>
        )
        const current = values[field.key]
        if (field.kind === "number") {
          return (
            <Field key={field.key}>
              {label}
              <Input
                id={id}
                type="number"
                inputMode="decimal"
                step="any"
                className="h-11 md:h-8"
                value={typeof current === "number" ? String(current) : ""}
                onChange={(event) => set(field.key, event.target.value === "" ? undefined : Number(event.target.value))}
              />
            </Field>
          )
        }
        if (field.kind === "text") {
          return (
            <Field key={field.key}>
              {label}
              <Input
                id={id}
                className="h-11 md:h-8"
                value={typeof current === "string" ? current : ""}
                onChange={(event) => set(field.key, event.target.value)}
              />
            </Field>
          )
        }
        if (field.kind === "single") {
          return (
            <SingleChoice
              key={field.key}
              field={field}
              id={id}
              label={label}
              value={typeof current === "string" ? current : ""}
              onChange={(value) => set(field.key, value)}
              otherLabel={t("customOther")}
            />
          )
        }
        return (
          <MultiChoice
            key={field.key}
            field={field}
            label={label}
            selected={Array.isArray(current) ? current : []}
            onChange={(value) => set(field.key, value)}
          />
        )
      })}
    </>
  )
}

function SingleChoice({
  field,
  id,
  label,
  value,
  onChange,
  otherLabel,
}: {
  field: CustomField
  id: string
  label: ReactNode
  value: string
  onChange: (value: string) => void
  otherLabel: string
}) {
  const isOther = value !== "" && !field.options.includes(value)
  const [otherOpen, setOtherOpen] = useState(isOther)
  const showOther = field.allow_other && (otherOpen || isOther)
  return (
    <Field>
      {label}
      <Dropdown
        id={id}
        className="w-full"
        value={showOther ? OTHER : value}
        onValueChange={(next) => {
          if (next === OTHER) {
            setOtherOpen(true)
            onChange("")
          } else {
            setOtherOpen(false)
            onChange(next)
          }
        }}
        options={[
          { value: "", label: "—" },
          ...field.options.map((option) => ({ value: option, label: option })),
          ...(field.allow_other ? [{ value: OTHER, label: otherLabel }] : []),
        ]}
      />
      {showOther ? (
        <Input
          aria-label={`${id}-other`}
          className="mt-2 h-11 md:h-8"
          value={isOther ? value : ""}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : null}
    </Field>
  )
}

function MultiChoice({
  field,
  label,
  selected,
  onChange,
}: {
  field: CustomField
  label: ReactNode
  selected: string[]
  onChange: (value: string[]) => void
}) {
  const others = selected.filter((item) => !field.options.includes(item))
  const [otherText, setOtherText] = useState(others.join(", "))
  return (
    <Field>
      {label}
      <div className="grid gap-2">
        {field.options.map((option) => (
          <label key={option} className="flex min-h-11 items-center gap-2 text-sm md:min-h-8">
            <Checkbox
              checked={selected.includes(option)}
              onCheckedChange={(checked) =>
                onChange(checked === true ? [...selected, option] : selected.filter((item) => item !== option))
              }
            />
            {option}
          </label>
        ))}
        {field.allow_other ? (
          <Input
            aria-label={`${field.key}-other`}
            className="h-11 md:h-8"
            value={otherText}
            onChange={(event) => {
              setOtherText(event.target.value)
              const kept = selected.filter((item) => field.options.includes(item))
              const extra = event.target.value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
              onChange([...kept, ...extra])
            }}
          />
        ) : null}
      </div>
    </Field>
  )
}

/** Staff filters for a type's custom fields: multi-select per field, number min and max. */
export function CustomFieldFilters({
  type,
  value,
  onChange,
}: {
  type: CertificateType
  value: CertificateFilters
  onChange: (value: CertificateFilters) => void
}) {
  const t = useT("certificates")
  const locale = useLocale()
  if (type.custom_fields.length === 0) return null
  const setCustom = (key: string, selected: string[]) => {
    const custom = { ...value.custom }
    if (selected.length === 0) delete custom[key]
    else custom[key] = selected
    onChange({ ...value, custom })
  }
  const setRange = (key: string, bound: "min" | "max", text: string) => {
    const ranges = { ...value.ranges }
    const current = { ...ranges[key], [bound]: text === "" ? null : Number(text) }
    if (current.min == null && current.max == null) delete ranges[key]
    else ranges[key] = current
    onChange({ ...value, ranges })
  }
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {type.custom_fields.map((field) => (
        <CustomFilter
          key={field.key}
          type={type}
          field={field}
          label={customFieldLabel(field, locale)}
          filters={value}
          selected={value.custom?.[field.key] ?? []}
          range={value.ranges?.[field.key]}
          onSelect={(selected) => setCustom(field.key, selected)}
          onRange={(bound, text) => setRange(field.key, bound, text)}
          minLabel={t("filters.min")}
          maxLabel={t("filters.max")}
          otherLabel={t("filters.otherValues")}
        />
      ))}
    </div>
  )
}

function CustomFilter({
  type,
  field,
  label,
  filters,
  selected,
  range,
  onSelect,
  onRange,
  minLabel,
  maxLabel,
  otherLabel,
}: {
  type: CertificateType
  field: CustomField
  label: string
  filters: CertificateFilters
  selected: string[]
  range: { min?: number | null; max?: number | null } | undefined
  onSelect: (selected: string[]) => void
  onRange: (bound: "min" | "max", text: string) => void
  minLabel: string
  maxLabel: string
  otherLabel: string
}) {
  const values = useQuery(
    getCustomFieldValuesQuery(field.key, {
      ...filters,
      custom: undefined,
      ranges: undefined,
      type_id: type.id,
    }),
  )
  if (field.kind === "number") {
    return (
      <Field>
        <FieldLabel>{label}</FieldLabel>
        <div className="grid grid-cols-2 gap-2">
          <Input
            aria-label={`${label} ${minLabel}`}
            type="number"
            placeholder={minLabel}
            value={range?.min != null ? String(range.min) : ""}
            onChange={(event) => onRange("min", event.target.value)}
          />
          <Input
            aria-label={`${label} ${maxLabel}`}
            type="number"
            placeholder={maxLabel}
            value={range?.max != null ? String(range.max) : ""}
            onChange={(event) => onRange("max", event.target.value)}
          />
        </div>
      </Field>
    )
  }
  const options = values.data?.options ?? field.options
  const others = values.data?.other_values ?? []
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Dropdown
        multiple
        aria-label={label}
        className="w-full"
        value={selected}
        onValueChange={onSelect}
        options={[
          ...options.map((option) => ({ value: option, label: option })),
          ...(others.length > 0
            ? [{ value: SEPARATOR_VALUE, label: `${SEPARATOR} ${otherLabel} ${SEPARATOR}`, disabled: true }]
            : []),
          ...others.map((item) => ({ value: item, label: item })),
        ]}
      />
    </Field>
  )
}
