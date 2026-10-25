"use client"

import type { GroupStudent } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge, Checkbox, ToggleGroup, ToggleGroupItem } from "@ihsp/ui"
import { fullName } from "../../shared/utils/people"
import type { Subgroup } from "../utils/subgroups"

/** One student of the subgroup editor: a checkbox for bulk selection and the buttons 1 and 2 (none = not set). */
export function SubgroupRow({
  student,
  subgroup,
  changed,
  selected,
  onSelect,
  onChange,
}: {
  student: GroupStudent
  subgroup: Subgroup
  changed: boolean
  selected: boolean
  onSelect: (selected: boolean) => void
  onChange: (subgroup: Subgroup) => void
}) {
  const t = useT("group.subgroups")
  const name = fullName(student)
  return (
    <li
      data-changed={changed}
      className="flex min-h-11 flex-wrap items-center gap-3 rounded-lg border p-2 data-[changed=true]:border-primary"
    >
      <Checkbox
        checked={selected}
        aria-label={t("select", { name })}
        onCheckedChange={(checked) => onSelect(checked === true)}
      />
      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <span className="truncate text-sm font-medium">{name}</span>
        {!student.registered ? <Badge variant="outline">{t("notRegistered")}</Badge> : null}
        {subgroup === null ? <Badge variant="secondary">{t("notSet")}</Badge> : null}
      </span>
      <ToggleGroup
        value={subgroup === null ? [] : [String(subgroup)]}
        variant="outline"
        aria-label={t("subgroupOf", { name })}
        onValueChange={(values) => {
          const next = values[0]
          onChange(next === "1" ? 1 : next === "2" ? 2 : null)
        }}
      >
        <ToggleGroupItem
          value="1"
          aria-label={t("setSubgroup", { name, number: 1 })}
          className="min-h-11 min-w-11 md:min-h-8 md:min-w-8"
        >
          1
        </ToggleGroupItem>
        <ToggleGroupItem
          value="2"
          aria-label={t("setSubgroup", { name, number: 2 })}
          className="min-h-11 min-w-11 md:min-h-8 md:min-w-8"
        >
          2
        </ToggleGroupItem>
      </ToggleGroup>
    </li>
  )
}
