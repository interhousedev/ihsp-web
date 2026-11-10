"use client"

import { useT } from "@ihsp/i18n"
import {
  IconBooks,
  IconBrandTelegram,
  IconCalendarWeek,
  IconCards,
  IconCertificate,
  IconHome,
  IconNotebook,
  IconSchool,
  IconSparkles,
  IconUserCheck,
  type Icon,
} from "@ihsp/ui"
import { Reveal } from "./reveal"

const TILES: [string, Icon][] = [
  ["dashboard", IconHome],
  ["timetable", IconCalendarWeek],
  ["marks", IconCertificate],
  ["journal", IconNotebook],
  ["assistant", IconSparkles],
  ["notebooks", IconCards],
  ["library", IconBooks],
  ["lms", IconSchool],
  ["bot", IconBrandTelegram],
  ["excuses", IconUserCheck],
]

/** Everything in one account, as a grid of tiles that rise in one after another. */
export function Ecosystem() {
  const t = useT("landing.eco")
  return (
    <section id="ecosystem" aria-labelledby="eco-title" className="scroll-mt-24 px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 id="eco-title" className="text-3xl font-bold tracking-tight text-balance sm:text-5xl">
            {t("headline")}
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">{t("hint")}</p>
        </Reveal>
        <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {TILES.map(([key, Glyph], index) => (
            <li key={key}>
              <Reveal
                delay={index * 60}
                className="bg-card h-full rounded-2xl border p-5 transition-shadow hover:shadow-lg"
              >
                <span className="mb-3 inline-flex size-11 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-text)]">
                  <Glyph aria-hidden className="size-6" />
                </span>
                <p className="font-semibold">{t(`tiles.${key}`)}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
