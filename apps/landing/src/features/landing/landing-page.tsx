"use client"

import { useT } from "@ihsp/i18n"
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

export function LandingPage() {
  const t = useT("landing")
  return (
    <>
      <a
        href="#main"
        className="bg-background sr-only z-50 rounded-md p-3 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        {t("skip")}
      </a>
      <SiteHeader />
      <main id="main">
        <Hero />
        <DashboardSection />
        <TimetableSection />
        <AssistantSection />
        <JournalSection />
        <LibrarySection />
        <BotSection />
        <ExcusesSection />
        <Ecosystem />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  )
}
