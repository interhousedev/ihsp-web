"use client"

import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { useT } from "@ihsp/i18n"

import { usePathname } from "next/navigation"
import { Suspense, type ReactNode } from "react"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { ScreenSummary } from "../../assistant/screen-context"

/** The frame of the chooser's detail pages (a university, the programs): title and body. The flow lives at /chooser/. */
export function ChooserPage({ children, title }: { children: ReactNode; title?: string }) {
  const t = useT("chooser")
  const pathname = usePathname()
  const inPrograms = pathname.startsWith("/chooser/programs/")
  const heading = title ?? (inPrograms ? t("programsTitle") : t("title"))
  return (
    <AdmissionShell>
      <ScreenSummary
        title={heading}
        summary={`University chooser, page ${pathname}. ${inPrograms ? "Programs" : "Universities"} tab.`}
      />
      <div className={pageClass()}>
        <AppPageHeader icon="search" title={heading} />
        <Suspense>{children}</Suspense>
      </div>
    </AdmissionShell>
  )
}
