"use client"

import type { SubjectDetail } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Input, StateView } from "@ihsp/ui"
import { useState } from "react"
import { ResourceList } from "../../lessons/components/resource-list"

/** Every material and attachment of the subject's lessons in one list, searchable by name (UF-WEB-05). */
export function SubjectMaterialsTab({ detail }: { detail: SubjectDetail }) {
  const t = useT("subjects.materials")
  const [search, setSearch] = useState("")
  const needle = search.trim().toLowerCase()
  const items = detail.materials.filter((item) => needle === "" || item.title.toLowerCase().includes(needle))

  return (
    <div className="flex flex-col gap-3">
      <Input
        type="search"
        value={search}
        aria-label={t("search")}
        placeholder={t("search")}
        className="h-11 md:h-8"
        onChange={(event) => setSearch(event.target.value)}
      />
      {items.length === 0 ? <StateView state="empty" emptyText={t("empty")} /> : <ResourceList items={items} />}
    </div>
  )
}
