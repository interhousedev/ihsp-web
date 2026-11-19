"use client"

import { useT } from "@ihsp/i18n"
import { IconBooks, IconBrandTelegram, IconCalendarWeek, IconChartBar, IconSchool, IconSparkles } from "@ihsp/ui"
import { useEffect, useState, type ComponentType } from "react"
import { ctaPrimary, ctaSecondary } from "./cta-styles"
import { SUPPORT_URL, useLandingLinks } from "./links"
import { useReducedMotion } from "./reveal"

const SOURCES = [
  { key: "timetable", Icon: IconCalendarWeek, path: "M18 26 C 28 26, 28 40, 36 40" },
  { key: "marks", Icon: IconChartBar, path: "M18 74 C 28 74, 28 60, 36 60" },
  { key: "library", Icon: IconBooks, path: "M82 26 C 72 26, 72 40, 64 40" },
  { key: "courses", Icon: IconSchool, path: "M82 74 C 72 74, 72 60, 64 60" },
] as const satisfies readonly { key: string; Icon: ComponentType<{ className?: string }>; path: string }[]

/** Steps of the example: 1 question, 2..5 one source and its answer line each, 6 the footnote. */
const LAST_STEP = SOURCES.length + 2
const FIRST_DELAY = 600
const STEP_DELAY = 800

/** Plays the example once (after mount); the static page and reduced motion show the finished conversation. */
function useChatStep(): number {
  const reduced = useReducedMotion()
  const [step, setStep] = useState(LAST_STEP)
  useEffect(() => {
    if (reduced) {
      setStep(LAST_STEP)
      return
    }
    setStep(0)
    const timers = Array.from({ length: LAST_STEP }, (_, index) =>
      setTimeout(() => setStep(index + 1), FIRST_DELAY + index * STEP_DELAY),
    )
    return () => timers.forEach(clearTimeout)
  }, [reduced])
  return step
}

function Applicants() {
  const t = useT("landing.banner")
  const links = useLandingLinks()
  return (
    <aside aria-label={t("label")} className="hero-note">
      {t("intro")}{" "}
      <a href={links.bot} target="_blank" rel="noopener noreferrer">
        {t("bot")}
      </a>{" "}
      {t("joiner")}
      <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">
        {t("support")}
      </a>
      {t("end")}
    </aside>
  )
}

/** An illustrative conversation (labelled as an example): the assistant answers from four sources. */
function ExampleChat({ step }: { step: number }) {
  const t = useT("landing.hero.chat")
  return (
    <div role="group" aria-label={t("label")} className="hero-phone" data-step={step}>
      <span aria-hidden className="hero-phone-notch" />
      <div className="hero-phone-screen">
        <div className="hc-head">
          <span aria-hidden className="hc-avatar">
            <IconSparkles className="size-4" />
          </span>
          {t("assistant")}
          <span className="hc-tag">{t("example")}</span>
        </div>
        <div className="hc-body">
          <p className="hc-user" data-on={step >= 1}>
            {t("question")}
          </p>
          <div aria-hidden className="hc-typing" data-on={step === 1}>
            <span />
            <span />
            <span />
          </div>
          <div className="hc-answer" data-on={step >= 2}>
            <p>{t("intro")}</p>
            <ul>
              {SOURCES.map(({ key }, index) => (
                <li key={key} className="hc-line" data-on={step >= index + 2}>
                  {t(`lines.${key}`)}
                </li>
              ))}
            </ul>
            <p className="hc-foot" data-on={step >= LAST_STEP}>
              {t("sources", { count: SOURCES.length })}
            </p>
          </div>
        </div>
        <div aria-hidden className="hc-input">
          {t("placeholder")}
        </div>
      </div>
    </div>
  )
}

/** The first screen: headline, the two calls to action and an example of the assistant drawing on four sources. */
export function Hero() {
  const t = useT("landing.hero")
  const links = useLandingLinks()
  const step = useChatStep()
  return (
    <section id="top" aria-labelledby="hero-title" className="hero lnd-on-dawn">
      <div aria-hidden className="hero-bg lnd-dawn" />
      <div className="hero-inner">
        <p className="hero-eyebrow">{t("eyebrow")}</p>
        <h1 id="hero-title" className="hero-title">
          {t("title")}
        </h1>
        <p className="hero-lead">{t("lead")}</p>
        <div className="hero-actions">
          <a href={`${links.sp}/`} className={ctaPrimary}>
            {t("cta")}
          </a>
          <a href={links.bot} target="_blank" rel="noopener noreferrer" className={ctaSecondary}>
            <IconBrandTelegram aria-hidden className="size-5" />
            {t("bot")}
          </a>
        </div>
        <Applicants />
      </div>
      <div className="hero-stage">
        <svg aria-hidden focusable="false" className="hero-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
          {SOURCES.map(({ key, path }, index) => (
            <path key={key} d={path} pathLength={1} data-on={step >= index + 2} />
          ))}
        </svg>
        <ExampleChat step={step} />
        {SOURCES.map(({ key, Icon }, index) => (
          <div key={key} className="hero-src lnd-glass" data-slot={index + 1} data-on={step >= index + 2}>
            <span aria-hidden className="hero-src-icon">
              <Icon className="size-6" />
            </span>
            <span>
              <span className="hero-src-title">{t(`sources.${key}.title`)}</span>
              <span className="hero-src-meta">{t(`sources.${key}.meta`)}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
