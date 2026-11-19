"use client"

import { useT } from "@ihsp/i18n"
import {
  IconAdjustments,
  IconArrowUpRight,
  IconBooks,
  IconCompass,
  IconHome,
  IconKey,
  IconSchool,
  IconShare,
  IconUserCheck,
  cn,
  type Icon,
} from "@ihsp/ui"
import { SectionHead } from "./parts/section-head"
import { useAppLinks, type AppKey } from "./parts/use-app-links"
import { Reveal } from "./reveal"

const APPS: { key: AppKey; icon: Icon; wide?: boolean }[] = [
  { key: "sp", icon: IconHome, wide: true },
  { key: "staff", icon: IconUserCheck },
  { key: "lms", icon: IconSchool },
  { key: "library", icon: IconBooks, wide: true },
  { key: "admission", icon: IconCompass },
  { key: "share", icon: IconShare },
  { key: "admin", icon: IconAdjustments, wide: true },
  { key: "id", icon: IconKey, wide: true },
]

/** One glass tile per app: what it is for and three things to do there. A tile links once its address is known. */
export function AppBento() {
  const t = useT("landing.apps")
  const links = useAppLinks()
  return (
    <section id="apps" aria-labelledby="apps-title" className="lnd-section">
      <SectionHead id="apps-title" eyebrow={t("eyebrow")} title={t("title")} />
      <ul className="lnd-bento">
        {APPS.map(({ key, icon: AppIcon, wide }, index) => {
          const href = links[key]
          const name = t(`items.${key}.name`)
          const body = (
            <>
              <span className="lnd-tile-icon">
                <AppIcon aria-hidden />
              </span>
              <span className="lnd-tile-name">
                {name}
                {href ? <IconArrowUpRight aria-hidden className="lnd-tile-arrow" /> : null}
              </span>
              <span className="lnd-tile-text">{t(`items.${key}.text`)}</span>
              <ul className="lnd-tile-actions">
                {(["a1", "a2", "a3"] as const).map((action) => (
                  <li key={action} className="lnd-pill lnd-tile-action">
                    {t(`items.${key}.${action}`)}
                  </li>
                ))}
              </ul>
            </>
          )
          return (
            <li key={key} className={cn("lnd-bento-cell", wide && "lnd-bento-wide")}>
              <Reveal delay={index * 60} className="h-full">
                {href ? (
                  <a href={`${href}/`} aria-label={t("open", { name })} className="lnd-tile lnd-glass">
                    {body}
                  </a>
                ) : (
                  <div className="lnd-tile lnd-glass">{body}</div>
                )}
              </Reveal>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
