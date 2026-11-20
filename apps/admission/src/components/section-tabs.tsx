"use client"

import { useT } from "@ihsp/i18n"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Suspense } from "react"
import { careerPlanQuery } from "../features/career/api"
import { sectionFor, type Section, type SectionPart } from "../config/nav"
import { PAGE_FRAME } from "./lib/page"
import { UnderlineTabs } from "./lib/underline-tabs"

const pathOf = (url: string) => (url.split("?")[0] ?? "").replace(/\/+$/, "")

/** The part of `section` the address points at: a `?tab=` query part, else the route part with the longest prefix. */
export function activePart(section: Section, pathname: string, tab: string | null): SectionPart | undefined {
  const path = pathname.replace(/\/+$/, "")
  const queryParts = section.parts.filter((part) => part.url.includes("?tab="))
  if (queryParts.length > 0) {
    return queryParts.find((part) => part.id === tab) ?? queryParts.find((part) => part.isDefault)
  }
  return section.parts
    .filter((part) => path === pathOf(part.url) || path.startsWith(`${pathOf(part.url)}/`))
    .sort((a, b) => pathOf(b.url).length - pathOf(a.url).length)[0]
}

function Tabs({ section }: { section: Section }) {
  const t = useT("nav")
  const router = useRouter()
  const pathname = usePathname()
  const tab = useSearchParams().get("tab")
  const current = activePart(section, pathname, tab)
  // The profile's study-field count rides on the Career "Field of study" tab.
  const plan = useQuery({ ...careerPlanQuery(), enabled: section.id === "career" })
  const countOf = (id: string) =>
    section.id === "career" && id === "field" ? (plan.data?.study_focus?.field_ids.length ?? 0) : undefined
  return (
    <div className={`${PAGE_FRAME} pt-2 print:hidden`} data-testid="section-tabs">
      <UnderlineTabs
        label={t("sectionParts", { section: t(`sections.${section.id}`) })}
        tabs={section.parts.map((part) => ({ value: part.id, label: t(`parts.${part.id}`), count: countOf(part.id) }))}
        value={current?.id ?? ""}
        onValueChange={(id) => {
          const part = section.parts.find((candidate) => candidate.id === id)
          if (part && part.id !== current?.id) router.push(part.url)
        }}
      />
    </div>
  )
}

/**
 * The part switcher of the section the current page belongs to; nothing on Home, Settings and other pages.
 * Rule: this is the only tab bar a section page renders; pages never add their own.
 */
export function SectionTabs() {
  const section = sectionFor(usePathname())
  if (!section || section.parts.length === 0) return null
  return (
    <Suspense fallback={null}>
      <Tabs section={section} />
    </Suspense>
  )
}
