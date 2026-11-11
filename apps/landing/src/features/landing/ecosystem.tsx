"use client"

import { useT } from "@ihsp/i18n"
import {
  IconBooks,
  IconBrandTelegram,
  IconCalendarWeek,
  IconCards,
  IconCertificate,
  IconCheck,
  IconChecklist,
  IconCloudUpload,
  IconMessageQuestion,
  IconPlugConnected,
  IconShieldCheck,
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

const MCP_TILES: [string, Icon][] = [
  ["ask", IconMessageQuestion],
  ["files", IconCloudUpload],
  ["submit", IconChecklist],
  ["teach", IconSchool],
]

/** The MCP servers: students and teachers connect their own AI assistant, scope by scope. */
function McpSection() {
  const t = useT("landing.mcp")
  return (
    <section id="mcp" aria-labelledby="mcp-title" className="bg-muted/40 scroll-mt-24 px-4 py-12 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-text)]">
            <IconPlugConnected aria-hidden className="size-7" />
          </span>
          <h2 id="mcp-title" className="mt-4 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            {t("title")}
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">{t("text")}</p>
          <ul className="mt-6 grid gap-3">
            {["p1", "p2", "p3"].map((key) => (
              <li key={key} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand-text)]">
                  <IconCheck aria-hidden className="size-4" />
                </span>
                {t(key)}
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground mt-5 flex items-start gap-2 text-sm">
            <IconShieldCheck aria-hidden className="mt-0.5 size-5 shrink-0" />
            {t("consent")}
          </p>
        </Reveal>
        <ul className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
          {MCP_TILES.map(([key, Glyph], index) => (
            <li key={key}>
              <Reveal delay={index * 80} className="bg-card rounded-card flex h-full items-center gap-3 border p-4">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-text)]">
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

/** Everything in one account, as a grid of tiles that rise in one after another. */
export function Ecosystem() {
  const t = useT("landing.eco")
  return (
    <>
      <section id="ecosystem" aria-labelledby="eco-title" className="scroll-mt-24 px-4 py-12 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 id="eco-title" className="text-3xl font-bold tracking-tight text-balance sm:text-5xl">
              {t("headline")}
            </h2>
            <p className="text-muted-foreground mt-4 text-lg">{t("hint")}</p>
          </Reveal>
          <ul className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 sm:grid-cols-3 lg:grid-cols-5">
            {TILES.map(([key, Glyph], index) => (
              <li key={key}>
                <Reveal
                  delay={index * 60}
                  className="bg-card rounded-card h-full border p-4 transition-shadow sm:p-5 hover:shadow-lg"
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
      <McpSection />
    </>
  )
}
