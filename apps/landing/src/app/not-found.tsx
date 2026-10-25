"use client"

import { useT } from "@ihsp/i18n"
import Link from "next/link"

export default function NotFound() {
  const t = useT("landing.notFound")
  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-content-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("description")}</p>
      <Link
        href="/"
        className="mx-auto inline-flex min-h-11 items-center rounded-full bg-[var(--brand)] px-6 font-medium text-[var(--brand-ink)]"
      >
        {t("home")}
      </Link>
    </main>
  )
}
