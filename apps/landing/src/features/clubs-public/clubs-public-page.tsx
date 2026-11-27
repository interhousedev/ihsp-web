"use client"

import { useT } from "@ihsp/i18n"
import { IconArrowUpRight, IconChevronLeft } from "@ihsp/ui"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { AnimatedBackdrop } from "../../components/backgrounds"
import { FinalCta, SiteFooter } from "../landing/footer"
import { ManifestoDialog } from "../landing/manifesto-dialog"
import { SectionHead } from "../landing/parts/section-head"
import { Reveal } from "../landing/reveal"
import { SiteHeader } from "../landing/site-header"
import { ClubLogo } from "./club-logo"
import { ContactFounderForm } from "./contact-founder-form"
import { hueOf } from "./public-clubs-api"
import { usePublicClubList, usePublicClubPage } from "./use-public-clubs"

/** Public clubs site in the design of the landing: same header, footer, headings and glass panels. */
export function ClubsPublicPage() {
  const t = useT("clubsPublic")
  const slug = useSearchParams().get("club")
  const list = usePublicClubList()
  const page = usePublicClubPage(slug)
  const clubs = list.data?.items ?? []
  const captchaKey = list.data?.captcha_site_key ?? ""
  const club = page.data
  const [manifesto, setManifesto] = useState(false)

  return (
    <>
      <div aria-hidden className="lnd-ambient">
        <AnimatedBackdrop />
      </div>
      <SiteHeader base="/" />
      <main id="main" className="overflow-x-clip">
        {!slug ? (
          <section aria-labelledby="clubs-title" className="lnd-section pt-32 md:pt-40">
            <SectionHead id="clubs-title" eyebrow={t("eyebrow")} title={t("title")}>
              <p className="lnd-body max-w-2xl">{t("lead")}</p>
            </SectionHead>
            {list.failed ? <p role="alert" className="lnd-body mb-6">{t("loadFailed")}</p> : null}
            {!list.loading && !list.failed && clubs.length === 0 ? <p className="lnd-body mb-6">{t("noClubs")}</p> : null}
            <ul className="lnd-bento lnd-bento--auto">
              {clubs.map((c, index) => (
                <li key={c.slug} className="lnd-bento-cell">
                  <Reveal delay={index * 60} className="h-full w-full">
                    <Link href={`/clubs/?club=${c.slug}`} className="lnd-tile lnd-panel">
                      <ClubLogo name={c.name} hue={hueOf(c.name)} />
                      <span className="lnd-tile-name">
                        {c.name}
                        <IconArrowUpRight aria-hidden className="lnd-tile-arrow size-5" />
                      </span>
                      <span className="lnd-tile-text">{c.description}</span>
                    </Link>
                  </Reveal>
                </li>
              ))}
            </ul>
          </section>
        ) : !club ? (
          <section className="lnd-section pt-32 md:pt-40">
            <Link href="/clubs/" className="lnd-link mb-6 inline-flex items-center gap-1 text-sm">
              <IconChevronLeft aria-hidden className="size-4" />
              {t("all")}
            </Link>
            {page.failed ? <p role="alert" className="lnd-body">{t("loadFailed")}</p> : null}
          </section>
        ) : (
          <>
            <section aria-labelledby="club-title" className="lnd-section pt-32 md:pt-40">
              <Link href="/clubs/" className="lnd-link mb-6 inline-flex items-center gap-1 text-sm">
                <IconChevronLeft aria-hidden className="size-4" />
                {t("all")}
              </Link>
              <div className="flex flex-col gap-5 md:flex-row md:items-center">
                <ClubLogo name={club.name} hue={hueOf(club.name)} size="size-24 text-3xl" />
                <div className="grid gap-2">
                  <h1 id="club-title" className="lnd-h2">
                    {club.name}
                  </h1>
                  <p className="lnd-body">{club.description}</p>
                  <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <a href={`https://app.ihsu.uz/activities/club/?slug=${club.slug}`} className="lnd-btn lnd-btn--solid justify-center">{t("join")}</a>
                    {club.contact_enabled ? <a href="#club-contact" className="lnd-btn justify-center">{t("contactCta")}</a> : null}
                  </div>
                </div>
              </div>
            </section>
            {club.team.length > 0 ? (
              <section className="lnd-section py-0">
                <Reveal className="lnd-panel grid content-start gap-2 p-6">
                  <h2 className="text-xl font-semibold">{t("team")}</h2>
                  <ul className="grid gap-1 text-base">
                    {club.team.map((m) => (
                      <li key={`${m.name}-${m.position}`}>
                        <span className="font-medium">{m.name}</span> <span className="text-muted-foreground">· {m.position}</span>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              </section>
            ) : null}
            {club.contact_enabled ? (
            <section aria-labelledby="club-contact" className="lnd-section">
              <div className="lnd-panel mx-auto grid max-w-xl gap-3 p-6 md:p-8">
                <h2 id="club-contact" className="text-2xl font-semibold">
                  {t("contactTitle")}
                </h2>
                <p className="text-muted-foreground text-sm">{t("contactLead")}</p>
                <ContactFounderForm slug={club.slug} club={club.name} captchaKey={captchaKey} />
              </div>
            </section>
            ) : null}
          </>
        )}
        <FinalCta />
      </main>
      <SiteFooter base="/" onOpenManifesto={() => setManifesto(true)} />
      <ManifestoDialog open={manifesto} onClose={() => setManifesto(false)} />
    </>
  )
}
