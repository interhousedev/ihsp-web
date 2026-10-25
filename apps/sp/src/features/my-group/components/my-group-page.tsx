"use client"

import { getMyGroupProgressQuery } from "@ihsp/api"
import { GroupProgressSection } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { PageContainer } from "@ihsp/ui"

/** My group: marks and attendance of the whole group, for its head student (read-only; others get `403`). */
export function MyGroupPage() {
  const t = useT("nav")
  return (
    <PageContainer title={t("myGroup")}>
      <GroupProgressSection queryFor={getMyGroupProgressQuery} />
    </PageContainer>
  )
}
