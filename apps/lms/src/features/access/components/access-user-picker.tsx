"use client"

import { getLmsCourseStaffQuery, getLmsCourseStudentsQuery, type AccessUser } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge, Field, FieldLabel, Input } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { personName } from "../../shared/utils/people"

/** Picks chosen people among the course's students and staff; the chosen ones show as removable chips. */
export function AccessUserPicker({
  courseId,
  value,
  known,
  readOnly,
  onChange,
}: {
  courseId: string
  value: string[]
  known: AccessUser[]
  readOnly: boolean
  onChange: (ids: string[]) => void
}) {
  const t = useT("access")
  const students = useQuery(getLmsCourseStudentsQuery(courseId))
  const staff = useQuery(getLmsCourseStaffQuery(courseId))
  const [term, setTerm] = useState("")
  const people = new Map<string, string>(known.map((user) => [user.id, user.name]))
  for (const item of staff.data ?? []) people.set(item.user.id, personName(item.user))
  for (const item of students.data ?? []) people.set(item.user.id, personName(item.user))
  const needle = term.trim().toLowerCase()
  const options = [...people].filter(([, name]) => !needle || name.toLowerCase().includes(needle))
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])
  return (
    <Field>
      <FieldLabel htmlFor="access-users">{t("users")}</FieldLabel>
      {value.length > 0 ? (
        <ul aria-label={t("usersChosen")} className="flex flex-wrap gap-2">
          {value.map((id) => (
            <li key={id}>
              <Badge variant="secondary" className="gap-2">
                {people.get(id) ?? id}
                {readOnly ? null : (
                  <button
                    type="button"
                    aria-label={t("userRemove", { name: people.get(id) ?? id })}
                    onClick={() => toggle(id)}
                  >
                    ×
                  </button>
                )}
              </Badge>
            </li>
          ))}
        </ul>
      ) : null}
      {readOnly ? null : (
        <>
          <Input
            id="access-users"
            type="search"
            value={term}
            placeholder={t("userSearch")}
            onChange={(e) => setTerm(e.target.value)}
            className="h-11 md:h-8"
          />
          <ul aria-label={t("userList")} className="max-h-56 overflow-y-auto rounded-md border">
            {options.map(([id, name]) => (
              <li key={id}>
                <label className="flex min-h-11 items-center gap-3 px-3 text-sm md:min-h-8">
                  <input type="checkbox" checked={value.includes(id)} onChange={() => toggle(id)} />
                  {name}
                </label>
              </li>
            ))}
          </ul>
        </>
      )}
    </Field>
  )
}
