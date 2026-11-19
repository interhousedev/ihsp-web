"use client"

import { pageClass } from "../../../components/lib/page"
import { useT } from "@ihsp/i18n"
import { type StepperItem } from "@ihsp/ui"
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
  { id: "universities", url: "/chooser/list/" },
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
      <div className={pageClass("wide", "overflow-x-clip")}>
        <MadeForHeader />
        <HomeWidgets />
      </div>
    </AdmissionShell>
  )
}
