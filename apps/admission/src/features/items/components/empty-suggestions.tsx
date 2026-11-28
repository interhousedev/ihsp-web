"use client"

import { useT } from "@ihsp/i18n"
import { buttonVariants, Icons } from "@ihsp/ui"
import Link from "next/link"
import { ITEM_CARD } from "./item-ui"

const SUGGESTIONS = [
  { key: "course", href: "/opportunities/?kind=course", icon: Icons.courses },
  { key: "certification", href: "/opportunities/?kind=certification", icon: Icons.certificates },
  { key: "exam", href: "/tests/", icon: Icons.exams },
] as const

/** Where to find a first activity when the list is empty, and a way to plan one instead. */
export function EmptySuggestions({ collapsed }: { collapsed: boolean }) {
  const t = useT("items")
  return (
    <details open={!collapsed} className="group flex flex-col gap-3">
      <summary className="flex min-h-11 w-fit cursor-pointer list-none items-center gap-1.5 text-sm font-medium">
        <Icons.chevronRight aria-hidden className="size-4 transition-transform group-open:rotate-90" />
        {t("suggest.title")}
      </summary>
      <ul className="mt-1 grid gap-3 sm:grid-cols-3">
        {SUGGESTIONS.map(({ key, href, icon: Icon }) => (
          <li key={key}>
            <Link
              href={href}
              className={`${ITEM_CARD} hover:bg-muted/40 flex h-full min-h-11 flex-col gap-1.5 transition-colors`}
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
    </details>
  )
}
