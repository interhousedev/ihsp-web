"use client"

import { useT } from "@ihsp/i18n"
import {
  IconBell,
  IconBook2,
  IconBrandTelegram,
  IconCalendarEvent,
  IconCards,
  IconCertificate,
  IconCompass,
  IconDeviceMobile,
  IconDeviceMobileDown,
  IconFileExport,
  IconKey,
  IconLanguage,
  IconLayoutDashboard,
  IconLink,
  IconMail,
  IconNotebook,
  IconPlugConnected,
  IconRefresh,
  IconSchool,
  IconShare,
  IconShieldLock,
  IconSparkles,
  IconWorldSearch,
  IconBulb,
  type Icon,
} from "@ihsp/ui"
import type { CSSProperties } from "react"
import { SectionHead } from "./parts/section-head"
import { Reveal } from "./reveal"

/** 24 real parts of the platform, three rows of eight. UniLibrary is not among them: that connection is switched off. */
const TILES: { key: string; icon: Icon }[] = [
  { key: "bot", icon: IconBrandTelegram },
  { key: "miniapp", icon: IconDeviceMobile },
  { key: "mcp", icon: IconPlugConnected },
  { key: "ics", icon: IconCalendarEvent },
  { key: "web", icon: IconWorldSearch },
  { key: "emis", icon: IconRefresh },
  { key: "sso", icon: IconKey },
  { key: "pwa", icon: IconDeviceMobileDown },
  { key: "mail", icon: IconMail },
  { key: "notify", icon: IconBell },
  { key: "openui", icon: IconLayoutDashboard },
  { key: "cards", icon: IconCards },
  { key: "notebooks", icon: IconNotebook },
  { key: "knowledge", icon: IconBulb },
  { key: "certificates", icon: IconCertificate },
  { key: "links", icon: IconLink },
  { key: "share", icon: IconShare },
  { key: "lms", icon: IconSchool },
  { key: "library", icon: IconBook2 },
  { key: "admission", icon: IconCompass },
  { key: "assistant", icon: IconSparkles },
  { key: "export", icon: IconFileExport },
  { key: "passkeys", icon: IconShieldLock },
  { key: "languages", icon: IconLanguage },
]

/** The platform's parts as tiles on a tilted plane (adapted from the library's integration grid); the list is the text version. */
export function IntegrationOrbit() {
  const t = useT("landing.integrations")
  return (
    <section id="integrations" aria-labelledby="integrations-title" className="lnd-section lnd-orbit-section">
      <SectionHead id="integrations-title" eyebrow={t("eyebrow")} title={t("title")} />
      <Reveal delay={120}>
        <div className="lnd-orbit">
          <ul aria-label={t("listLabel")} className="lnd-orbit-plane">
            {TILES.map(({ key, icon: TileIcon }, index) => (
              <li key={key} className="lnd-orbit-tile" style={{ "--lnd-i": index } as CSSProperties}>
                <span className="lnd-orbit-face">
                  <TileIcon aria-hidden className="lnd-orbit-icon" />
                  <span className="lnd-orbit-name">{t(`items.${key}`)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  )
}
