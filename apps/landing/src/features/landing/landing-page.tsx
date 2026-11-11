"use client"

import { useT } from "@ihsp/i18n"
import { useMemo } from "react"
import { ChapterRail } from "../../components/chapter-rail"
import { Ecosystem } from "./ecosystem"
import { FinalCta, SiteFooter } from "./footer"
import { Hero } from "./hero"
import {
  AssistantSection,
  BotSection,
  DashboardSection,
  ExcusesSection,
  JournalSection,
  LibrarySection,
  TimetableSection,
} from "./sections"
import { SiteHeader } from "./site-header"

/** Height of the fixed header incl. its top margin; chapter jumps land below it. */
const HEADER_OFFSET = 72

export function LandingPage() {
  const t = useT("landing")
  const tiles = useT("landing.eco.tiles")
  const chapters = useMemo(
    () => [
      { id: "top", label: tiles("dashboard") },
      { id: "features", label: t("nav.features") },
      { id: "timetable", label: tiles("timetable") },
      { id: "assistant", label: tiles("assistant") },
      { id: "journal", label: tiles("journal") },
      { id: "library", label: tiles("library") },
      { id: "bot", label: tiles("bot") },
      { id: "excuses", label: tiles("excuses") },
      { id: "ecosystem", label: t("nav.ecosystem") },
    ],
    [t, tiles],
  )
  return (
    <>
      <a
        href="#main"
        className="bg-background sr-only z-50 rounded-md p-3 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        {t("skip")}
      </a>
      <SiteHeader />
      <ChapterRail chapters={chapters} label={t("nav.label")} headerOffset={HEADER_OFFSET} hideBeforeId="start" />
      <main id="main" className="overflow-x-clip">
        <Hero />
        <DashboardSection />
        <TimetableSection />
        <AssistantSection />
        <JournalSection />
        <LibrarySection />
        <BotSection />
        <ExcusesSection />
        <Ecosystem />
        <div id="start">
          <FinalCta />
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
