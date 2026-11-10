"use client"

import { useT } from "@ihsp/i18n"
import { DeviceFrame } from "../../components/device-mockup/device-frame"
import { FeatureSection } from "./feature-section"
import { BotPhone } from "./screens/bot"
import { DashboardPhone, DashboardTablet } from "./screens/dashboard"
import { NotebookLaptop } from "./screens/ai"
import { ExcusesTablet, JournalLaptop } from "./screens/staff"
import { LibraryPhone, LmsTablet } from "./screens/learn"
import { MarksPhone, TimetablePhone } from "./screens/study"

type SectionKey = "dashboard" | "timetable" | "assistant" | "journal" | "library" | "bot" | "excuses"

function useCopy(key: SectionKey) {
  const t = useT(`landing.sections.${key}`)
  return {
    title: t("title"),
    text: t("text"),
    points: [t("p1"), t("p2"), t("p3")],
  }
}

export function DashboardSection() {
  const t = useT("landing.sections.dashboard")
  return (
    <FeatureSection id="features" {...useCopy("dashboard")}>
      <div className="w-full max-w-[560px]">
        <DeviceFrame device="tablet" label={t("alt")}>
          <DashboardTablet />
        </DeviceFrame>
      </div>
    </FeatureSection>
  )
}

export function TimetableSection() {
  const t = useT("landing.sections.timetable")
  return (
    <FeatureSection id="timetable" reverse tint {...useCopy("timetable")}>
      <div className="flex w-full max-w-[460px] items-start gap-4">
        <div className="w-1/2">
          <DeviceFrame device="phone" label={t("alt")}>
            <TimetablePhone />
          </DeviceFrame>
        </div>
        <div className="mt-10 w-1/2">
          <DeviceFrame device="phone" label={t("alt2")}>
            <MarksPhone />
          </DeviceFrame>
        </div>
      </div>
    </FeatureSection>
  )
}

export function AssistantSection() {
  const t = useT("landing.sections.assistant")
  return (
    <FeatureSection id="assistant" {...useCopy("assistant")}>
      <div className="w-full max-w-[620px]">
        <DeviceFrame device="laptop" label={t("alt")}>
          <NotebookLaptop />
        </DeviceFrame>
      </div>
    </FeatureSection>
  )
}

export function JournalSection() {
  const t = useT("landing.sections.journal")
  return (
    <FeatureSection id="journal" reverse tint {...useCopy("journal")}>
      <div className="w-full max-w-[620px]">
        <DeviceFrame device="laptop" label={t("alt")}>
          <JournalLaptop />
        </DeviceFrame>
      </div>
    </FeatureSection>
  )
}

export function LibrarySection() {
  const t = useT("landing.sections.library")
  return (
    <FeatureSection id="library" {...useCopy("library")}>
      <div className="flex w-full max-w-[560px] items-end gap-4">
        <div className="w-[68%]">
          <DeviceFrame device="tablet" label={t("alt")}>
            <LmsTablet />
          </DeviceFrame>
        </div>
        <div className="w-[32%]">
          <DeviceFrame device="phone" label={t("alt2")}>
            <LibraryPhone />
          </DeviceFrame>
        </div>
      </div>
    </FeatureSection>
  )
}

export function BotSection() {
  const t = useT("landing.sections.bot")
  return (
    <FeatureSection id="bot" reverse tint {...useCopy("bot")}>
      <div className="flex w-full max-w-[440px] items-start gap-4">
        <div className="w-1/2">
          <DeviceFrame device="phone" label={t("alt")}>
            <BotPhone />
          </DeviceFrame>
        </div>
        <div className="mt-10 w-1/2">
          <DeviceFrame device="phone" label={t("alt2")}>
            <DashboardPhone />
          </DeviceFrame>
        </div>
      </div>
    </FeatureSection>
  )
}

export function ExcusesSection() {
  const t = useT("landing.sections.excuses")
  return (
    <FeatureSection id="excuses" {...useCopy("excuses")}>
      <div className="w-full max-w-[560px]">
        <DeviceFrame device="tablet" label={t("alt")}>
          <ExcusesTablet />
        </DeviceFrame>
      </div>
    </FeatureSection>
  )
}
