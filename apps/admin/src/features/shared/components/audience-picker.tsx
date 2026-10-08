"use client"

import type { GroupItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { CheckField } from "./check-field"

export type AudienceChoice = { group_id: string; subgroup: 1 | 2 | null }

/** Toggle one choice; "whole group" and its subgroups exclude each other, subgroups 1 and 2 can be combined. */
export function toggleAudience(
  value: readonly AudienceChoice[],
  groupId: string,
  subgroup: 1 | 2 | null,
  checked: boolean,
): AudienceChoice[] {
  const others = value.filter((item) => item.group_id !== groupId)
  const own = value.filter((item) => item.group_id === groupId)
  if (!checked) return [...others, ...own.filter((item) => item.subgroup !== subgroup)]
  if (subgroup === null) return [...others, { group_id: groupId, subgroup: null }]
  return [
    ...others,
    ...own.filter((item) => item.subgroup !== null && item.subgroup !== subgroup),
    { group_id: groupId, subgroup },
  ]
}

/**
 * Who a lesson is for: per group the whole group or subgroup 1 and/or 2. Several groups can be merged into one
 * lesson (ACA-5).
 */
export function AudiencePicker({
  groups,
  value,
  onChange,
}: {
  groups: readonly GroupItem[]
  value: readonly AudienceChoice[]
  onChange: (value: AudienceChoice[]) => void
}) {
  const t = useT("shared.audience")
  const has = (groupId: string, subgroup: 1 | 2 | null) =>
    value.some((item) => item.group_id === groupId && item.subgroup === subgroup)
  return (
    <fieldset className="flex flex-col gap-1 rounded-lg border p-2">
      <legend className="sr-only">{t("legend")}</legend>
      {groups.length === 0 ? <p className="text-muted-foreground p-2 text-sm">{t("noGroups")}</p> : null}
      {groups.map((group) => (
        <div
          key={group.id}
          role="group"
          aria-label={group.name}
          className="flex flex-wrap items-center gap-x-4 border-b py-1 last:border-b-0"
        >
          <span className="w-20 text-sm font-medium">{group.name}</span>
          <CheckField
            checked={has(group.id, null)}
            label={t("whole")}
            onChange={(checked) => onChange(toggleAudience(value, group.id, null, checked))}
          />
          <CheckField
            checked={has(group.id, 1)}
            label={t("subgroup", { number: 1 })}
            onChange={(checked) => onChange(toggleAudience(value, group.id, 1, checked))}
          />
          <CheckField
            checked={has(group.id, 2)}
            label={t("subgroup", { number: 2 })}
            onChange={(checked) => onChange(toggleAudience(value, group.id, 2, checked))}
          />
        </div>
      ))}
    </fieldset>
  )
}
