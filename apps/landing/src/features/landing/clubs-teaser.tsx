"use client"

import { useT } from "@ihsp/i18n"
import { IconArrowUpRight } from "@ihsp/ui"
import Link from "next/link"
import { ClubLogo } from "../clubs-public/club-logo"
import { hueOf } from "../clubs-public/public-clubs-api"
import { usePublicClubList } from "../clubs-public/use-public-clubs"
import { SectionHead } from "./parts/section-head"
import { Reveal } from "./reveal"
import { ctaSecondary } from "./cta-styles"

/** Club tiles and a link to the clubs site. */
export function ClubsTeaser() {
  const t = useT("landing.clubsTeaser")
  const { data } = usePublicClubList()
  const clubs = data?.items
  return (
    <section id="clubs" aria-labelledby="clubs-title" className="lnd-section">
      <SectionHead id="clubs-title" eyebrow={t("eyebrow")} title={t("title")}>
        <p className="lnd-body max-w-2xl">{t("lead")}</p>
      </SectionHead>
      <ul className="lnd-bento lnd-bento--auto">
        {(clubs ?? []).map((c, index) => (
          <li key={c.slug} className="lnd-bento-cell">
            <Reveal delay={index * 60} className="h-full">
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
      <div className="mt-8 flex justify-center">
        <Link href="/clubs/" className={ctaSecondary}>
          {t("all")}
        </Link>
      </div>
    </section>
  )
}
