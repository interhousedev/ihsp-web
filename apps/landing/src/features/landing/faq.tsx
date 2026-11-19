"use client"

import { useT } from "@ihsp/i18n"
import { IconPlus, cn } from "@ihsp/ui"
import { useState } from "react"
import { useLandingLinks } from "./links"
import { SectionHead } from "./parts/section-head"
import { Reveal } from "./reveal"
import { parseSecurityContact } from "./security-contact"

const QUESTIONS = ["q1", "q2", "q3", "q4", "q5", "q6"] as const

/** Numbered questions that open with a grid-rows transition, and the support contact from the runtime config. */
export function Faq() {
  const t = useT("landing.faq")
  const { securityContact } = useLandingLinks()
  const [open, setOpen] = useState<string | null>(null)
  return (
    <section id="faq" aria-labelledby="faq-title" className="lnd-section">
      <SectionHead id="faq-title" eyebrow={t("eyebrow")} title={t("title")} />
      <Reveal delay={120}>
        <ol className="lnd-faq">
          {QUESTIONS.map((key, index) => {
            const expanded = open === key
            return (
              <li key={key} className={cn("lnd-faq-item", expanded && "lnd-faq-open")}>
                <h3>
                  <button
                    type="button"
                    id={`faq-button-${key}`}
                    aria-expanded={expanded}
                    aria-controls={`faq-panel-${key}`}
                    className="lnd-faq-button"
                    onClick={() => setOpen(expanded ? null : key)}
                  >
                    <span className="lnd-faq-number" aria-hidden>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="lnd-faq-question">{t(`items.${key}.q`)}</span>
                    <IconPlus aria-hidden className="lnd-faq-plus" />
                  </button>
                </h3>
                <div
                  id={`faq-panel-${key}`}
                  role="region"
                  aria-labelledby={`faq-button-${key}`}
                  className="lnd-collapse"
                  data-open={expanded}
                >
                  <div className="lnd-collapse-inner">
                    <p className="lnd-faq-answer">{t(`items.${key}.a`)}</p>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      </Reveal>
      {securityContact ? (
        <p className="lnd-faq-contact">
          {t("contact")}{" "}
          {parseSecurityContact(securityContact).map((part, index) =>
            part.kind === "text" ? (
              <span key={index}>{part.text}</span>
            ) : (
              <a key={index} href={part.href} className="lnd-link">
                {part.text}
              </a>
            ),
          )}
        </p>
      ) : null}
    </section>
  )
}
