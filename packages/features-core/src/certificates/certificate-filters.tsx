"use client"

import type { CertificateFilters, CertificateGroup, CertificateType } from "@ihsp/api"
import { useLocale, useT } from "@ihsp/i18n"
import { Button, Input, NativeSelect, NativeSelectOption } from "@ihsp/ui"
import { typeName } from "./utils"

type Props = {
  value: CertificateFilters
  onChange: (value: CertificateFilters) => void
  groups: CertificateGroup[]
  types: CertificateType[]
}

function Select({
  label,
  value,
  all,
  options,
  onChange,
}: {
  label: string
  value: string
  all: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <NativeSelect
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full"
    >
      <NativeSelectOption value="">{all}</NativeSelectOption>
      {options.map((option) => (
        <NativeSelectOption key={option.value} value={option.value}>
          {option.label}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  )
}

/** Group, subgroup, type, subject, level and student filters of the staff views. */
export function CertificateFiltersBar({ value, onChange, groups, types }: Props) {
  const t = useT("certificates.filters")
  const locale = useLocale()
  const set = (patch: CertificateFilters) => {
    const next: CertificateFilters = { ...value, ...patch }
    if (patch.group_id !== undefined && patch.group_id !== value.group_id) delete next.subgroup
    for (const key of Object.keys(next) as (keyof CertificateFilters)[]) if (!next[key]) delete next[key]
    onChange(next)
  }
  const group = groups.find((item) => item.id === value.group_id)
  const levelsOf = value.type_id
    ? (types.find((type) => type.id === value.type_id)?.levels ?? [])
    : types.flatMap((type) => type.levels)
  const levels = [...new Set(levelsOf)]
  const active = Object.values(value).some(Boolean)
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <Select
        label={t("group")}
        value={value.group_id ?? ""}
        all={t("allGroups")}
        options={groups.map((item) => ({ value: item.id, label: item.name }))}
        onChange={(group_id) => set({ group_id })}
      />
      <Select
        label={t("subgroup")}
        value={value.subgroup ?? ""}
        all={t("allSubgroups")}
        options={(group?.subgroups ?? []).map((item) => ({ value: item, label: item }))}
        onChange={(subgroup) => set({ subgroup })}
      />
      <Select
        label={t("type")}
        value={value.type_id ?? ""}
        all={t("allTypes")}
        options={types.map((type) => ({ value: type.id, label: typeName(type, locale) }))}
        onChange={(type_id) => set({ type_id, level: undefined })}
      />
      <Select
        label={t("level")}
        value={value.level ?? ""}
        all={t("allLevels")}
        options={levels.map((item) => ({ value: item, label: item }))}
        onChange={(level) => set({ level })}
      />
      <Input
        aria-label={t("subject")}
        placeholder={t("subject")}
        value={value.subject ?? ""}
        onChange={(event) => set({ subject: event.target.value })}
      />
      <Input
        aria-label={t("student")}
        placeholder={t("student")}
        value={value.q ?? ""}
        onChange={(event) => set({ q: event.target.value })}
      />
      {active ? (
        <Button type="button" variant="outline" onClick={() => onChange({})}>
          {t("reset")}
        </Button>
      ) : null}
    </div>
  )
}
