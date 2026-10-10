"use client"

import { useT } from "@ihsp/i18n"
import { IconBell, IconBolt, IconShieldLock, IconWifiOff } from "@ihsp/ui"

const BENEFITS = [
  { key: "fast", icon: IconBolt },
  { key: "offline", icon: IconWifiOff },
  { key: "session", icon: IconShieldLock },
  { key: "push", icon: IconBell },
] as const

/** Reasons to install, one line each. Push is one of them: on iPhone it only works for an installed app. */
export function LandingBenefits() {
  const t = useT("pwa")
  return (
    <ul className="flex flex-col gap-2">
      {BENEFITS.map(({ key, icon: Icon }) => (
        <li key={key} className="flex items-center gap-3 text-sm">
          <Icon aria-hidden className="text-primary size-5 shrink-0" />
          {t(`benefits.${key}`)}
        </li>
      ))}
    </ul>
  )
}
