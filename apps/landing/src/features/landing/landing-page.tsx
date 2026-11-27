"use client"

import { useT } from "@ihsp/i18n"
import { useState } from "react"
import { AnimatedBackdrop } from "../../components/backgrounds"
import { AppBento } from "./app-bento"
import { ClubsTeaser } from "./clubs-teaser"
import { Faq } from "./faq"
import { FeatureAccordion } from "./feature-accordion"
import { FinalCta, SiteFooter } from "./footer"
import { Hero } from "./hero"
import { IntegrationOrbit } from "./integration-orbit"
import { ManifestoDialog } from "./manifesto-dialog"
import { PillCloud } from "./pill-cloud"
import { SetupSteps } from "./setup-steps"
import { SiteHeader } from "./site-header"
import { SplitControl, SplitInSight } from "./split-features"
import { Testimonials } from "./testimonials"

export function LandingPage() {
  const t = useT("landing")
  const [manifestoOpen, setManifestoOpen] = useState(false)
  return (
    <>
      <a
        href="#main"
        className="bg-background sr-only z-50 rounded-md p-3 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        {t("skip")}
      </a>
      <div aria-hidden className="lnd-ambient">
        <AnimatedBackdrop />
      </div>
      <SiteHeader />
      <main id="main" className="overflow-x-clip">
        <Hero />
        <PillCloud />
        <FeatureAccordion />
        <AppBento />
        <IntegrationOrbit />
        <SplitInSight />
        <SplitControl />
        <ClubsTeaser />
        <Testimonials />
        <SetupSteps />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter onOpenManifesto={() => setManifestoOpen(true)} />
      <ManifestoDialog open={manifestoOpen} onClose={() => setManifestoOpen(false)} />
    </>
  )
}
