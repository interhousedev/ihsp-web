"use client"

import { useT } from "@ihsp/i18n"
import {
  IconBell,
  IconBook,
  IconBrandTelegram,
  IconCalendarWeek,
  IconCards,
  IconChecklist,
  IconMail,
  IconNotebook,
  IconSparkles,
  IconUserCheck,
  SourceCodeLinks,
  type Icon,
} from "@ihsp/ui"
import { useLandingLinks, type LandingLinks } from "./links"
import { LocaleSwitch } from "./locale-switch"
import { PhoneFrame } from "./phone-frame"
import { parseSecurityContact } from "./security-contact"

type BenefitKey =
  | "marks"
  | "timetable"
  | "homework"
  | "attendance"
  | "bot"
  | "assistant"
  | "notebooks"
  | "flashcards"
  | "mail"
  | "library"

const WHY: [BenefitKey, Icon][] = [
  ["marks", IconBell],
  ["timetable", IconCalendarWeek],
  ["homework", IconChecklist],
  ["attendance", IconUserCheck],
  ["bot", IconBrandTelegram],
]

const HOW: [BenefitKey, Icon][] = [
  ["assistant", IconSparkles],
  ["notebooks", IconNotebook],
  ["flashcards", IconCards],
  ["mail", IconMail],
  ["library", IconBook],
]

type PlatformKey = "sp" | "staff" | "lms" | "library" | "bot"

/** Screens of /public/screens (real captures of the local stack with the demo data). */
const PLATFORMS: { key: PlatformKey; link: keyof LandingLinks; screens: { id: string; file: string }[] }[] = [
  {
    key: "sp",
    link: "sp",
    screens: [
      { id: "home", file: "sp-home.webp" },
      { id: "timetable", file: "sp-timetable.webp" },
      { id: "notebooks", file: "sp-notebooks.webp" },
    ],
  },
  { key: "staff", link: "staff", screens: [{ id: "journal", file: "staff-journal.webp" }] },
  { key: "lms", link: "lms", screens: [{ id: "course", file: "lms-course.webp" }] },
  { key: "library", link: "library", screens: [{ id: "catalog", file: "library-catalog.webp" }] },
  { key: "bot", link: "bot", screens: [{ id: "assistant", file: "sp-assistant.webp" }] },
]

const linkButton =
  "inline-flex min-h-11 items-center justify-center rounded-full px-5 text-center font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"

function BenefitGrid({ items }: { items: [BenefitKey, Icon][] }) {
  const t = useT("landing.benefits")
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(([key, Glyph]) => (
        <li key={key} className="bg-card rounded-2xl border p-5">
          <span className="mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-text)]">
            <Glyph aria-hidden className="size-5" />
          </span>
          <h3 className="font-semibold">{t(`${key}.title`)}</h3>
          <p className="text-muted-foreground mt-1 text-sm">{t(`${key}.text`)}</p>
        </li>
      ))}
    </ul>
  )
}

function SecurityContact({ contact }: { contact: string }) {
  const t = useT("landing.footer")
  return (
    <p className="text-sm">
      <span className="text-muted-foreground">{t("security")}: </span>
      {parseSecurityContact(contact).map((part, index) =>
        part.kind === "text" ? (
          <span key={index}>{part.text}</span>
        ) : (
          <a
            key={index}
            href={part.href}
            className="inline-flex min-h-11 items-center text-[var(--brand-text)] underline underline-offset-4"
          >
            {part.text}
          </a>
        ),
      )}
    </p>
  )
}

export function LandingPage() {
  const t = useT("landing")
  const links = useLandingLinks()

  return (
    <>
      <a
        href="#main"
        className="bg-background sr-only z-50 rounded-md p-3 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        {t("skip")}
      </a>
      <header className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        {/* oxlint-disable-next-line nextjs/no-img-element -- static export, the logo is a plain file of /public */}
        <img src="/icons/logo.svg" alt={t("logoAlt")} width={40} height={40} className="size-10 rounded-lg" />
        <span className="text-lg font-semibold">{t("brand")}</span>
      </header>

      <main id="main">
        <section className="mx-auto max-w-6xl px-4 pt-8 pb-12 sm:pt-16">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-5xl">
              <span className="text-[var(--brand-text)]">my.iht</span> · {t("headline")}
            </h1>
            <p className="text-muted-foreground mt-4 text-lg">{t("lead")}</p>
            <div className="mt-8 flex flex-col gap-2">
              <a
                href={links.bot}
                target="_blank"
                rel="noopener noreferrer"
                className={`${linkButton} bg-[var(--brand)] py-4 text-lg text-[var(--brand-ink)] shadow-lg hover:bg-[var(--brand-strong)] sm:self-start sm:px-8`}
              >
                <IconBrandTelegram aria-hidden className="mr-2 size-6 shrink-0" />
                {t("ctaApply")}
              </a>
              <span className="text-muted-foreground text-sm">{t("ctaApplyHint")}</span>
            </div>
            <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-[var(--brand-soft)] p-4 sm:flex-row sm:items-center">
              <p className="flex-1 text-sm sm:text-base">{t("ctaStudent")}</p>
              <a
                href={`${links.sp}/`}
                className={`${linkButton} border border-[var(--brand-text)] text-[var(--brand-text)] hover:bg-[var(--brand)] hover:text-[var(--brand-ink)]`}
              >
                {t("ctaStudentButton")}
              </a>
            </div>
          </div>
        </section>

        <section aria-labelledby="why" className="mx-auto max-w-6xl px-4 py-10">
          <h2 id="why" className="text-2xl font-bold sm:text-3xl">
            {t("why.title")}
          </h2>
          <p className="text-muted-foreground mt-2 mb-6">{t("why.lead")}</p>
          <BenefitGrid items={WHY} />
        </section>

        <section aria-labelledby="how" className="mx-auto max-w-6xl px-4 py-10">
          <h2 id="how" className="mb-6 text-2xl font-bold sm:text-3xl">
            {t("how.title")}
          </h2>
          <BenefitGrid items={HOW} />
        </section>

        <section aria-labelledby="platforms" className="mx-auto max-w-6xl px-4 py-10">
          <h2 id="platforms" className="text-2xl font-bold sm:text-3xl">
            {t("platforms.title")}
          </h2>
          <p className="text-muted-foreground mt-2 mb-8">{t("platforms.lead")}</p>
          <div className="grid gap-12">
            {PLATFORMS.map(({ key, link, screens }) => {
              const name = t(`platforms.${key}.name`)
              return (
                <article key={key} className="grid gap-6 md:grid-cols-[minmax(0,1fr)_2fr] md:items-center">
                  <div>
                    <p className="text-sm font-medium text-[var(--brand-text)]">{t(`platforms.${key}.for`)}</p>
                    <h3 className="mt-1 text-xl font-semibold">{name}</h3>
                    <ul className="text-muted-foreground mt-3 list-disc space-y-1 pl-5">
                      {["f1", "f2", "f3"].map((feature) => (
                        <li key={feature}>{t(`platforms.${key}.features.${feature}`)}</li>
                      ))}
                    </ul>
                    <a
                      href={link === "bot" ? links.bot : `${String(links[link])}/`}
                      className={`${linkButton} mt-4 border hover:bg-muted`}
                      {...(link === "bot" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      {t("platforms.open", { name })}
                    </a>
                  </div>
                  <div className="flex snap-x gap-4 overflow-x-auto pb-2">
                    {screens.map((screen) => (
                      <div key={screen.id} className="w-[220px] shrink-0 snap-center sm:w-[240px]">
                        <PhoneFrame
                          src={`/screens/${screen.file}`}
                          alt={t("platforms.screenAlt", { name, screen: t(`platforms.${key}.screens.${screen.id}`) })}
                        />
                      </div>
                    ))}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </main>

      <footer className="mt-10 border-t">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-2">
          <nav aria-label={t("footer.apps")}>
            <h2 className="mb-2 font-semibold">{t("footer.apps")}</h2>
            <ul className="flex flex-wrap gap-x-4">
              {PLATFORMS.map(({ key, link }) => (
                <li key={key}>
                  <a
                    href={link === "bot" ? links.bot : `${String(links[link])}/`}
                    className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
                  >
                    {t(`platforms.${key}.name`)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="grid gap-3 sm:justify-items-end">
            <LocaleSwitch />
            {links.securityContact ? <SecurityContact contact={links.securityContact} /> : null}
          </div>
          <p className="text-muted-foreground text-sm sm:col-span-2">© {t("footer.rights")}</p>
          <SourceCodeLinks className="sm:col-span-2 sm:justify-start" />
        </div>
      </footer>
    </>
  )
}
