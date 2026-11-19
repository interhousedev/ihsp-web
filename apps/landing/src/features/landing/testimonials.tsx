"use client"

import { useT } from "@ihsp/i18n"
import { SectionHead } from "./parts/section-head"
import { Reveal } from "./reveal"

const ROLES = ["student", "teacher", "librarian", "admin"] as const

/** Four example conversations by role. They are illustrations, labelled as such, with no names and no real quotes. */
export function Testimonials() {
  const t = useT("landing.voices")
  return (
    <section id="voices" aria-labelledby="voices-title" className="lnd-section">
      <SectionHead id="voices-title" eyebrow={t("eyebrow")} title={t("title")}>
        <p className="lnd-note">{t("note")}</p>
      </SectionHead>
      <ul aria-label={t("listLabel")} className="lnd-voices">
        {ROLES.map((role, index) => (
          <li key={role}>
            <Reveal delay={index * 80} className="h-full">
              <figure className="lnd-panel lnd-voice">
                <figcaption className="lnd-voice-head">
                  <span className="lnd-label">{t(`items.${role}.role`)}</span>
                  <span className="lnd-badge">{t("example")}</span>
                </figcaption>
                <p className="lnd-bubble lnd-bubble-ask">{t(`items.${role}.q`)}</p>
                <p className="lnd-bubble lnd-bubble-answer">{t(`items.${role}.a`)}</p>
              </figure>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  )
}
