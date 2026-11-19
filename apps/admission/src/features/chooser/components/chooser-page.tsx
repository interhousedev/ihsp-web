"use client"

import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { useT } from "@ihsp/i18n"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Suspense, type ReactNode } from "react"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { ScreenSummary } from "../../assistant/screen-context"
import { ListPlanning } from "./list-planning"

const SECTIONS = [
  { key: "search", href: "/chooser/search/" },
  { key: "list", href: "/chooser/list/" },
  { key: "budget", href: "/chooser/budget/" },
] as const

/** The frame of the chooser pages: title, the section strip (once), and the page body. Programs live at /opportunities/. */
export function ChooserPage({ children, title }: { children: ReactNode; title?: string }) {
  const t = useT("chooser")
  const pathname = usePathname()
  const inPrograms = pathname.startsWith("/chooser/programs/")
  const heading = title ?? (inPrograms ? t("programsTitle") : t("title"))
  return (
    <AdmissionShell>
      <ScreenSummary
        title={heading}
        summary={`University chooser, section ${pathname}. ${inPrograms ? "Programs" : "Universities"} tab.`}
      />
      <div className={pageClass("wide", "md:gap-4 md:py-6")}>
        <AppPageHeader icon="search" title={heading} />
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
