"use client"

import { useT } from "@ihsp/i18n"
import { buttonVariants, type StepperItem } from "@ihsp/ui"
import Link from "next/link"
import { useMemo } from "react"
import { useProfile } from "../../profile/api"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { HomeWidgets, MadeForHeader } from "./home-widgets"
import { ScreenSummary } from "../../assistant/screen-context"

/** The application steps in order; the route of a step is its id. Progress comes from the backend once it exists. */
const STEPS = [
  { id: "id", url: "/" },
  { id: "profile", url: "/setup/" },
  { id: "activities", url: "/activities/" },
  { id: "plans", url: "/plan/" },
  { id: "universities", url: "/chooser/" },
  { id: "documents", url: "/documents/" },
] as const

export function HomePage() {
  const t = useT("home")
  const profile = useProfile()
  const done = useMemo(
    () => new Set<string>(["id", ...(profile.data?.setup_completed ? ["profile"] : [])]),
    [profile.data],
  )
  const current = STEPS.find((step) => !done.has(step.id))?.id ?? ""
  const items = useMemo<StepperItem[]>(
    () =>
      STEPS.map((step) => ({
        id: step.id,
        label: t(`steps.${step.id}`),
        status: done.has(step.id) ? "complete" : step.id === current ? "current" : "upcoming",
      })),
    [t, done, current],
  )
  return (
    <AdmissionShell home>
      <ScreenSummary
        title={t("title")}
        summary={`Home. Application steps: ${items.map((i) => `${i.label} (${i.status})`).join(", ")}.`}
      />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 overflow-x-clip p-4 md:p-6">
        <MadeForHeader />
        <HomeWidgets />
        <nav aria-label={t("linksLabel")} className="flex flex-wrap gap-2">
          <Link href="/words/" className={buttonVariants({ variant: "outline" })}>
            {t("links.words")}
          </Link>
          <Link href="/alignment/" className={buttonVariants({ variant: "outline" })}>
            {t("links.alignment")}
          </Link>
          <Link href="/courses/" className={buttonVariants({ variant: "outline" })}>
            {t("links.courses")}
          </Link>
        </nav>
      </div>
    </AdmissionShell>
  )
}
