"use client"

import { useT } from "@ihsp/i18n"
import { PageHeader } from "@ihsp/ui"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Suspense, type ReactNode } from "react"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { ScreenSummary } from "../../assistant/screen-context"
import { ListPlanning } from "./list-planning"

const SECTIONS = [
  { key: "search", href: "/chooser/search/" },
  { key: "list", href: "/chooser/list/" },
  { key: "scholarships", href: "/chooser/scholarships/" },
] as const

const TABS = [
  { key: "universities", href: "/chooser/search/", active: (p: string) => !p.startsWith("/chooser/programs/") },
  { key: "programs", href: "/chooser/programs/", active: (p: string) => p.startsWith("/chooser/programs/") },
] as const

/** The frame of the chooser pages: title, the section strip, and the page body. */
export function ChooserPage({ children, title }: { children: ReactNode; title?: string }) {
  const t = useT("chooser")
  const pathname = usePathname()
  const inPrograms = pathname.startsWith("/chooser/programs/")
  return (
    <AdmissionShell>
      <ScreenSummary
        title={title ?? (inPrograms ? t("programsTitle") : t("title"))}
        summary={`University chooser, section ${pathname}. ${inPrograms ? "Programs" : "Universities"} tab.`}
      />
      <div className="mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-6 p-4 md:p-6">
        <PageHeader title={title ?? (inPrograms ? t("programsTitle") : t("title"))} />
        <nav aria-label={t("tabs.label")} className="flex gap-2 overflow-x-auto border-b">
          {TABS.map(({ key, href, active }) => (
            <Link
              key={key}
              href={href}
              aria-current={active(pathname) ? "page" : undefined}
              className="aria-[current=page]:border-primary aria-[current=page]:text-foreground text-muted-foreground -mb-px inline-flex min-h-11 items-center border-b-2 border-transparent px-4 text-sm font-medium whitespace-nowrap md:min-h-9"
            >
              {t(`tabs.${key}`)}
            </Link>
          ))}
        </nav>
        {inPrograms ? null : (
          <nav aria-label={t("sections.label")} className="flex gap-2 overflow-x-auto">
            {SECTIONS.map(({ key, href }) => (
              <Link
                key={key}
                href={href}
                aria-current={pathname.startsWith(href) ? "page" : undefined}
                className="aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground bg-muted inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium whitespace-nowrap md:min-h-9"
              >
                {t(`sections.${key}`)}
              </Link>
            ))}
          </nav>
        )}
        {pathname.startsWith("/chooser/list/") ? <ListPlanning /> : null}
        <Suspense>{children}</Suspense>
      </div>
    </AdmissionShell>
  )
}
