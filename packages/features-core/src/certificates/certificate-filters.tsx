"use client"

import type { CertificateFilters, CertificateGroup, CertificateType } from "@ihsp/api"
import { useLocale, useT } from "@ihsp/i18n"
import { ListToolbar } from "@ihsp/ui"
import { CustomFieldFilters } from "./custom-fields"
import { typeName } from "./utils"

type Props = {
  value: CertificateFilters
  onChange: (value: CertificateFilters) => void
  groups: CertificateGroup[]
  types: CertificateType[]
}

/**
 * Group, subgroup, type and student filters of the staff views.
 * With exactly one type selected, one filter per custom field of that type follows.
 */
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
  const active = Object.values(value).some(Boolean)
  const selectedType = value.type_id ? types.find((type) => type.id === value.type_id) : undefined
  return (
    <div className="flex flex-col gap-2">
      <ListToolbar
        filters={[
          {
            kind: "select",
            key: "group_id",
            label: t("group"),
            allLabel: t("allGroups"),
            options: groups.map((item) => ({ value: item.id, label: item.name })),
          },
          {
            kind: "select",
            key: "subgroup",
            label: t("subgroup"),
            allLabel: t("allSubgroups"),
            options: (group?.subgroups ?? []).map((item) => ({ value: item, label: item })),
          },
          {
            kind: "select",
            key: "type_id",
            label: t("type"),
            allLabel: t("allTypes"),
            options: types.map((type) => ({ value: type.id, label: typeName(type, locale) })),
          },
          { kind: "search", key: "q", label: t("student"), debounceMs: 0 },
        ]}
        values={{ group_id: value.group_id, subgroup: value.subgroup, type_id: value.type_id, q: value.q }}
        onChange={(key, next) => {
          const text = next ?? ""
          if (key === "group_id") set({ group_id: text })
          else if (key === "subgroup") set({ subgroup: text })
          else if (key === "type_id") set({ type_id: text, custom: undefined, ranges: undefined })
          else set({ q: text })
        }}
        active={active}
        onReset={() => onChange({})}
      />
      {selectedType ? <CustomFieldFilters type={selectedType} value={value} onChange={onChange} /> : null}
    </div>
  )
}
