"use client"

import { getAdminAiExtensionsQuery } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"

/** On a user's page: a link to the Limits page when the student has an active AI limit extension. */
export function ExtensionBadge({ userId }: { userId: string }) {
  const t = useT("limits.extensions")
  const query = useQuery({
    ...getAdminAiExtensionsQuery({ user_id: userId }),
    enabled: userId !== "",
  })
  const active = query.data?.items.find((item) => item.user_id === userId && item.active)
  if (!active) return null
  const text = active.expires_on ? t("badge", { date: active.expires_on }) : t("badgeForever")
  return (
    <Link href="/limits/" className="text-primary text-sm underline-offset-4 hover:underline">
      {text}
    </Link>
  )
}
