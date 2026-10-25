"use client"

import { getAdminGroupsQuery, getStaffGroupsQuery } from "@ihsp/api"
import { useSession } from "@ihsp/auth"
import { useT } from "@ihsp/i18n"
import { Badge, Field, FieldLabel, Input } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

/** Case-insensitive name filter of the group list. */
export function filterGroups<T extends { name: string }>(groups: readonly T[], term: string): T[] {
  const needle = term.trim().toLowerCase()
  return needle ? groups.filter((group) => group.name.toLowerCase().includes(needle)) : [...groups]
}

/** Searchable list of groups (administrators see all active groups, teachers the groups they curate). */
export function GroupPicker({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
  const t = useT("courseSettings")
  const { session } = useSession()
  const isAdmin = session?.user.roles.includes("admin") ?? false
  const staff = useQuery({ ...getStaffGroupsQuery(), enabled: !isAdmin })
  const admin = useQuery({ ...getAdminGroupsQuery({ status: "active" }), enabled: isAdmin })
  const [term, setTerm] = useState("")
  const groups = (isAdmin ? admin.data : staff.data) ?? []
  const names = new Map(groups.map((group) => [group.id, group.name]))
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])
  return (
    <Field>
      <FieldLabel htmlFor="scope-groups">{t("groupIds")}</FieldLabel>
      {value.length > 0 ? (
        <ul aria-label={t("groupsChosen")} className="flex flex-wrap gap-2">
          {value.map((id) => (
            <li key={id}>
              <Badge variant="secondary" className="gap-2">
                {names.get(id) ?? id}
                <button
                  type="button"
                  aria-label={t("groupRemove", { name: names.get(id) ?? id })}
                  onClick={() => toggle(id)}
                >
                  ×
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      ) : null}
      <Input
        id="scope-groups"
        type="search"
        value={term}
        placeholder={t("groupSearch")}
        onChange={(e) => setTerm(e.target.value)}
        className="h-11 md:h-8"
      />
      <ul aria-label={t("groupList")} className="max-h-56 overflow-y-auto rounded-md border">
        {filterGroups(groups, term).map((group) => (
          <li key={group.id}>
            <label className="flex min-h-11 items-center gap-3 px-3 text-sm md:min-h-8">
              <input type="checkbox" checked={value.includes(group.id)} onChange={() => toggle(group.id)} />
              {group.name}
            </label>
          </li>
        ))}
      </ul>
    </Field>
  )
}
