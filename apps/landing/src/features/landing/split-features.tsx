"use client"

import { useT } from "@ihsp/i18n"
import {
  IconFileExport,
  IconHistory,
  IconListDetails,
  IconShieldCheck,
  IconUserCheck,
  IconChecklist,
  cn,
  type Icon,
} from "@ihsp/ui"
import type { ReactNode } from "react"
import { DeviceFrame } from "../../components/device-mockup/device-frame"
import { SectionHead } from "./parts/section-head"
import { Reveal } from "./reveal"
import { JournalLaptop } from "./screens/staff"

type Bullet = { key: "b1" | "b2" | "b3"; icon: Icon }

function Split({
  id,
  ns,
  bullets,
  reverse,
  visual,
}: {
  id: string
  ns: "landing.insight" | "landing.control"
  bullets: Bullet[]
  reverse?: boolean
  visual: ReactNode
}) {
  const t = useT(ns)
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="lnd-section">
      <div className={cn("lnd-split", reverse && "lnd-split-reverse")}>
        <div className="lnd-split-copy">
          <SectionHead id={`${id}-title`} eyebrow={t("eyebrow")} title={t("title")} align="start" />
          <ul className="lnd-bullets">
            {bullets.map(({ key, icon: BulletIcon }, index) => (
              <li key={key}>
                <Reveal delay={index * 80} className="lnd-bullet">
                  <span className="lnd-bullet-icon">
                    <BulletIcon aria-hidden />
                  </span>
                  <span>
                    <span className="lnd-bullet-title">{t(`${key}.title`)}</span>
                    <span className="lnd-bullet-text">{t(`${key}.text`)}</span>
                  </span>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
        <Reveal delay={120} className="lnd-split-visual">
          {visual}
        </Reveal>
      </div>
    </section>
  )
}

/** The teacher's view of a class: marks, attendance and homework status, on the real journal screen. */
export function SplitInSight() {
  const t = useT("landing.insight")
  return (
    <Split
      id="insight"
      ns="landing.insight"
      bullets={[
        { key: "b1", icon: IconChecklist },
        { key: "b2", icon: IconUserCheck },
        { key: "b3", icon: IconListDetails },
      ]}
      visual={
        <DeviceFrame device="laptop" label={t("screen")}>
          <JournalLaptop />
        </DeviceFrame>
      }
    />
  )
}

const SCOPES = [
  { key: "scope1", on: true },
  { key: "scope2", on: true },
  { key: "scope3", on: false },
] as const

/** Consent, assistant permissions, the call log and data export or erasure. The panel is an illustration and says so. */
export function SplitControl() {
  const t = useT("landing.control")
  const tApps = useT("landing.apps")
  return (
    <Split
      id="control"
      ns="landing.control"
      reverse
      bullets={[
        { key: "b1", icon: IconShieldCheck },
        { key: "b2", icon: IconHistory },
        { key: "b3", icon: IconFileExport },
      ]}
      visual={
        <div role="group" aria-label={t("visualLabel")} className="lnd-panel lnd-control-card">
          <span className="lnd-badge">{tApps("example")}</span>
          <p className="lnd-control-title">{t("scopesTitle")}</p>
          <ul className="lnd-control-rows">
            {SCOPES.map(({ key, on }) => (
              <li key={key} className="lnd-control-row">
                <span>{t(key)}</span>
                <span className={cn("lnd-switch", on && "lnd-switch-on")}>{on ? t("on") : t("off")}</span>
              </li>
            ))}
          </ul>
          <p className="lnd-control-title">{t("logTitle")}</p>
          <ul className="lnd-control-rows">
            {(["log1", "log2"] as const).map((key) => (
              <li key={key} className="lnd-control-row lnd-control-log">
                <IconHistory aria-hidden />
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
        </div>
      }
    />
  )
}
