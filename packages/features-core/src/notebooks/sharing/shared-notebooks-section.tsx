"use client"

import { getSharedNotebooksQuery } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"

/** "Shared with me" on the notebooks page; absent while nothing is shared. */
export function SharedNotebooksSection() {
  const t = useT("notebooks.share")
  const shared = useQuery(getSharedNotebooksQuery())
  const items = shared.data?.items ?? []
  if (items.length === 0) return null
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-medium">{t("sharedWithMe")}</h2>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((notebook) => (
          <li key={notebook.id}>
            <Link
              href={`/notebooks/view/?id=${encodeURIComponent(notebook.id)}`}
              className="hover:bg-accent rounded-card flex min-h-11 flex-col gap-1 border p-3"
            >
              <span className="truncate font-medium">
                {notebook.emoji ? `${notebook.emoji} ` : ""}
                {notebook.title}
              </span>
              <span className="text-muted-foreground truncate text-sm">
                {t("sharedBy", { name: notebook.owner_name })}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
