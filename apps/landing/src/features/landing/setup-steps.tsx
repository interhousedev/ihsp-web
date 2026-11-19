"use client"

import { useT } from "@ihsp/i18n"
import { IconBrandTelegram, IconDeviceMobileDown, IconKey, type Icon } from "@ihsp/ui"
import { SectionHead } from "./parts/section-head"
import { Reveal } from "./reveal"

const STEPS: { key: "s1" | "s2" | "s3"; icon: Icon }[] = [
  { key: "s1", icon: IconKey },
  { key: "s2", icon: IconBrandTelegram },
  { key: "s3", icon: IconDeviceMobileDown },
]

/** Sign in, link Telegram, install the app or connect an assistant. */
export function SetupSteps() {
  const t = useT("landing.start")
  return (
    <section id="start" aria-labelledby="start-title" className="lnd-section">
      <SectionHead id="start-title" eyebrow={t("eyebrow")} title={t("title")} />
      <ol className="lnd-steps">
        {STEPS.map(({ key, icon: StepIcon }, index) => (
          <li key={key}>
            <Reveal delay={index * 100} className="h-full">
              <div className="lnd-panel lnd-step">
                <span className="lnd-step-visual">
                  <StepIcon aria-hidden />
                </span>
                <p className="lnd-label">{t("step", { n: index + 1 })}</p>
                <h3 className="lnd-step-title">{t(`items.${key}.title`)}</h3>
                <p className="lnd-body">{t(`items.${key}.text`)}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  )
}
