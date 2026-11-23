"use client"

import { Icons } from "@ihsp/ui"
import { useT } from "@ihsp/i18n"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
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
  const SectionIcon = Icons[section.icon]
  return (
    // Pinned under the phone top bar (and at the top on desktop) so the parts stay one tap away while reading.
    <div
      className="bg-background/85 sticky top-(--shell-top-reserve) z-20 py-2 backdrop-blur print:hidden"
      data-testid="section-tabs"
    >
      <nav aria-label={t(`sections.${section.id}`)} className={PAGE_FRAME}>
        <UnderlineTabs
          label={t("sectionParts", { section: t(`sections.${section.id}`) })}
          lead={
            <>
              <SectionIcon aria-hidden className="text-muted-foreground size-5" />
              <span className="text-sm font-semibold whitespace-nowrap">{t(`sections.${section.id}`)}</span>
            </>
          }
          tabs={section.parts.map((part) => ({
            value: part.id,
            label: t(`parts.${part.id}`),
            icon: part.icon,
            startsGroup: part.startsGroup,
          }))}
          value={current?.id ?? ""}
          onValueChange={(id) => {
            const part = section.parts.find((candidate) => candidate.id === id)
            if (part && part.id !== current?.id) router.push(part.url)
          }}
        />
      </nav>
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
