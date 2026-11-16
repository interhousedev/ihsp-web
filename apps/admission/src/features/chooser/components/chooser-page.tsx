"use client"

import { useT } from "@ihsp/i18n"
import { PageHeader } from "@ihsp/ui"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Suspense, type ReactNode } from "react"
import { AdmissionShell } from "../../shell/components/admission-shell"

const SECTIONS = [
  { key: "search", href: "/chooser/search/" },
  { key: "list", href: "/chooser/list/" },
  { key: "scholarships", href: "/chooser/scholarships/" },
] as const

/** The frame of the chooser pages: title, the section strip, and the page body. */
export function ChooserPage({ children, title }: { children: ReactNode; title?: string }) {
  const t = useT("chooser")
  const pathname = usePathname()
  return (
    <AdmissionShell>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-6">
        <PageHeader title={title ?? t("title")} />
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
        <Suspense>{children}</Suspense>
      </div>
    </AdmissionShell>
  )
}
