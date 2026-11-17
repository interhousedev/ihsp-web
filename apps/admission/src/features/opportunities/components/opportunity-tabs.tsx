"use client"

import { useT } from "@ihsp/i18n"
import { useRouter } from "next/navigation"
import { UnderlineTabs } from "../../../components/lib/underline-tabs"

const ROUTES = {
  catalog: "/opportunities/",
  scholarships: "/opportunities/scholarships/",
  plan: "/opportunities/plan/",
} as const

/** The catalog / scholarships / saved tab strip shared by the three opportunity pages. */
export function OpportunityTabs({ value, planCount }: { value: keyof typeof ROUTES; planCount: number }) {
  const t = useT("opportunities")
  const router = useRouter()
  return (
    <UnderlineTabs
      label={t("view.tabs")}
      value={value}
      onValueChange={(next) => {
        if (next !== value && next in ROUTES) router.push(ROUTES[next as keyof typeof ROUTES])
      }}
      tabs={[
        { value: "catalog", label: t("view.catalog"), icon: "courses" },
        { value: "scholarships", label: t("view.scholarships"), icon: "certificates" },
        { value: "plan", label: t("view.plan"), icon: "heart", count: planCount, tone: "primary" },
      ]}
    />
  )
}
