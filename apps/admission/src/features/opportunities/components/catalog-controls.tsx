"use client"

import { useT } from "@ihsp/i18n"
import { Icons, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ihsp/ui"
import Link from "next/link"
import type { ReactNode } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { UnderlineTabs } from "../../../components/lib/underline-tabs"
import { CATALOG_SORTS, type CatalogSort, type OpportunityKind } from "../api"

/** The catalog kinds in tab order; "all" has no `kind`. Exams live in Tests. */
export const CATEGORIES = [
  "all",
  "scholarship",
  "course",
  "certification",
  "research",
  "event",
  "program",
] as const satisfies readonly (OpportunityKind | "all")[]
export type Category = (typeof CATEGORIES)[number]

const CATEGORY_ICON = {
  all: "search",
  scholarship: "grades",
  course: "courses",
  certification: "certificates",
  research: "library",
  event: "calendarEvent",
  program: "globe",
} as const satisfies Record<Category, string>

/** The `?kind=` value as a category; anything unknown means "all". */
export function parseCategory(value: string | null): Category {
  return CATEGORIES.find((c) => c === value) ?? "all"
}

/** The `?sort=` value, if it is one the catalog offers. */
export function parseSort(value: string | null): CatalogSort | undefined {
  return CATALOG_SORTS.find((s) => s === value)
}

/**
 * The one tab row of Opportunities: the catalog kinds plus the project ideas tool. It owns navigation, so the catalog
 * and the projects page show the same row. On the catalog a kind change keeps `sort` and replaces the URL.
 */
export function OpportunityNav({ value }: { value: Category | "projects" }) {
  const t = useT("opportunities")
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const onCatalog = pathname.replace(/\/$/, "") === "/opportunities"

  function go(next: string) {
    if (next === "projects") {
      router.push("/opportunities/projects/")
      return
    }
    const category = parseCategory(next)
    const query = new URLSearchParams(onCatalog ? params.toString() : "")
    if (category === "all") query.delete("kind")
    else query.set("kind", category)
    const text = query.toString()
    if (!onCatalog) router.push(text ? `/opportunities/?${text}` : "/opportunities/")
    else router.replace(text ? `${pathname}?${text}` : pathname)
  }

  return (
    <UnderlineTabs
      hideIconsBelowXl
      label={t("categories.label")}
      value={value}
      onValueChange={go}
      tabs={[
        ...CATEGORIES.map((c) => ({ value: c, label: t(`categories.${c}`), icon: CATEGORY_ICON[c] })),
        { value: "projects", label: t("categories.projects"), icon: "sparkles" as const },
      ]}
    />
  )
}

/** Tells the list is ordered by the student's fields of study (with the way to change them) and offers the sort. */
export function RelevanceBar({
  sort,
  labels,
  onSort,
  leading,
}: {
  sort: CatalogSort | "ranking" | "acceptance" | "tuition"
  labels: string[]
  onSort: (sort: CatalogSort) => void
  /** A control placed before the banner, e.g. the phone filters button. */
  leading?: ReactNode
}) {
  const t = useT("opportunities")
  const shown = CATALOG_SORTS.find((s) => s === sort)
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
      {leading}
      {sort === "relevance" ? (
        <p className="text-muted-foreground flex flex-wrap items-center gap-1">
          <Icons.sparkles aria-hidden className="size-4" />
          {t("sorting.banner", { fields: labels.join(", ") })}
          <span className="whitespace-nowrap">
            {"· "}
            <Link href="/career/?tab=field" className="text-primary underline">
              {t("sorting.change")}
            </Link>
          </span>
        </p>
      ) : (
        <span />
      )}
      <Select value={shown ?? "title"} onValueChange={(next) => onSort(parseSort(next) ?? "title")}>
        <SelectTrigger aria-label={t("sorting.label")} className="w-auto min-w-40">
          <SelectValue>{t(`sorting.${shown ?? "title"}`)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {CATALOG_SORTS.map((s) => (
            <SelectItem key={s} value={s}>
              {t(`sorting.${s}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
