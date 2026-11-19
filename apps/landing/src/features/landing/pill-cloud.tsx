"use client"

import { useT } from "@ihsp/i18n"
import { IconBooks, IconCalendarWeek, IconChecklist, IconNotebook, IconSchool, IconSparkles, type Icon } from "@ihsp/ui"
import type { CSSProperties } from "react"
import { SectionHead } from "./parts/section-head"
import { Reveal } from "./reveal"

const PILLS: { key: string; icon: Icon }[] = [
  { key: "timetable", icon: IconCalendarWeek },
  { key: "marks", icon: IconChecklist },
  { key: "book", icon: IconBooks },
  { key: "course", icon: IconSchool },
  { key: "essay", icon: IconNotebook },
  { key: "assistant", icon: IconSparkles },
]

/** Six everyday actions as floating glass pills. */
export function PillCloud() {
  const t = useT("landing.pills")
  return (
    <section id="actions" aria-labelledby="actions-title" className="lnd-section lnd-actions">
      <SectionHead id="actions-title" eyebrow={t("eyebrow")} title={t("title")} />
      <Reveal delay={120}>
        <ul aria-label={t("listLabel")} className="lnd-pill-cloud">
          {PILLS.map(({ key, icon: PillIcon }, index) => (
            <li key={key} className="lnd-pill lnd-float" style={{ "--lnd-i": index } as CSSProperties}>
              <PillIcon aria-hidden className="lnd-pill-icon" />
              {t(`items.${key}`)}
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  )
}
