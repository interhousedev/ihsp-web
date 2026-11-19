"use client"

import { useT } from "@ihsp/i18n"
import { buttonVariants, Icons } from "@ihsp/ui"
import Link from "next/link"

const SUGGESTIONS = [
  { key: "course", href: "/opportunities/?kind=course", icon: Icons.courses },
  { key: "certification", href: "/opportunities/?kind=certification", icon: Icons.certificates },
  { key: "exam", href: "/tests/", icon: Icons.exams },
] as const

/** Where to find a first activity when the list is empty, and a way to plan one instead. */
export function EmptySuggestions() {
  const t = useT("items")
  return (
    <section aria-label={t("suggest.title")} className="flex flex-col gap-3">
      <h2 className="text-sm font-medium">{t("suggest.title")}</h2>
      <ul className="grid gap-3 sm:grid-cols-3">
        {SUGGESTIONS.map(({ key, href, icon: Icon }) => (
          <li key={key}>
            <Link
              href={href}
              className="border-hairline bg-card hover:bg-muted/40 rounded-card flex h-full min-h-11 flex-col gap-1.5 border p-3 transition-colors"
            >
              <Icon aria-hidden className="text-primary size-5" />
              <span className="font-medium">{t(`suggest.${key}.title`)}</span>
              <span className="text-muted-foreground text-sm">{t(`suggest.${key}.text`)}</span>
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/plan/" className={buttonVariants({ variant: "outline", className: "w-fit" })}>
        <Icons.target aria-hidden />
        {t("suggest.plan")}
      </Link>
    </section>
  )
}
