"use client"

import { useT } from "@ihsp/i18n"
import { useBackButton } from "@ihsp/telegram"
import { Icons } from "@ihsp/ui"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback } from "react"

/** "Back to Timetable" link above a detail page; inside Telegram the native back button does the same. */
export function BackLink({ href, label }: { href: string; label: string }) {
  const t = useT("common")
  const router = useRouter()
  const goBack = useCallback(() => router.push(href), [router, href])
  useBackButton(goBack)
  return (
    <Link
      href={href}
      aria-label={`${t("back")}: ${label}`}
      className="text-muted-foreground hover:text-foreground flex min-h-11 w-fit items-center gap-1 text-sm"
    >
      <Icons.chevronLeft className="size-4" aria-hidden />
      {label}
    </Link>
  )
}
