"use client"

import type { ItemDetail } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import type { ReactNode } from "react"
import { itemLanguageLabel } from "./item-language"

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-2 py-1.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  )
}

/** The facts of an item as a definition list: authors, publisher, year, pages, language, type, ISBN, subjects. */
export function ItemDetails({ item }: { item: ItemDetail }) {
  const t = useT("library.item")
  const library = useT("library")
  const isbn = item.isbn ?? item.external_isbn ?? null
  const authors = item.author_label
  const primary = item.files.find((file) => file.is_primary) ?? item.files[0]
  const pages = item.page_count ?? primary?.pages ?? null
  return (
    <section aria-labelledby="item-details-title" className="flex flex-col gap-1">
      <h2 id="item-details-title" className="text-base font-semibold">
        {t("details")}
      </h2>
      <dl className="divide-y">
        {authors ? <Row label={t("authors")}>{authors}</Row> : null}
        {item.publisher ? <Row label={t("publisher")}>{item.publisher}</Row> : null}
        {item.year_published ? <Row label={t("year")}>{item.year_published}</Row> : null}
        {pages ? <Row label={t("pages")}>{pages}</Row> : null}
        <Row label={t("language")}>{itemLanguageLabel(item.language, (key) => library(key))}</Row>
        <Row label={t("type")}>{library(`type.${item.type}`)}</Row>
        {isbn ? <Row label={t("isbn")}>{isbn}</Row> : null}
        {item.subjects.length > 0 ? (
          <Row label={t("subjects")}>{item.subjects.map((s) => s.name).join(", ")}</Row>
        ) : null}
        {item.years_of_study.length > 0 ? <Row label={t("yearsOfStudy")}>{item.years_of_study.join(", ")}</Row> : null}
      </dl>
    </section>
  )
}
