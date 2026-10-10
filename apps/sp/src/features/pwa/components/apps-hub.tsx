"use client"

import { useT } from "@ihsp/i18n"
import { buttonVariants, cn } from "@ihsp/ui"
import { IconBook2, IconBooks, IconSchool, IconShieldLock, IconUsers } from "@ihsp/ui"
import { useEffect, useState, type ComponentType } from "react"
import { useHubApps, type HubAppKey } from "../hooks/use-hub-apps"

const ICONS: Record<HubAppKey, ComponentType<{ className?: string }>> = {
  sp: IconSchool,
  lms: IconBook2,
  library: IconBooks,
  staff: IconUsers,
  admin: IconShieldLock,
}

/** The card an address like `/#install-lms` points to, or `null`. */
export function hubAnchorKey(hash: string): HubAppKey | null {
  const match = /^#install-(sp|lms|library|staff|admin)$/.exec(hash)
  return (match?.[1] as HubAppKey | undefined) ?? null
}

/** The app the address hash names: follows `hashchange`, scrolls that card into view and keeps it highlighted. */
function useHighlightedApp(apps: readonly { key: HubAppKey }[]): HubAppKey | null {
  const [active, setActive] = useState<HubAppKey | null>(null)
  const listed = apps.map((app) => app.key).join(",")
  useEffect(() => {
    function sync() {
      const key = hubAnchorKey(window.location.hash)
      setActive(key)
      if (key) document.getElementById(`install-${key}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
    }
    sync()
    window.addEventListener("hashchange", sync)
    return () => window.removeEventListener("hashchange", sync)
  }, [listed])
  return active
}

/**
 * The apps hub of the installable host: every IHSP app that can be installed, each with a one-line description. The student
 * app installs on this page (the steps above); the others open on their own host, where the browser or the profile menu
 * installs them. Staff and admin are marked, an app without a configured address is not listed.
 */
export function AppsHub() {
  const t = useT("pwa")
  const apps = useHubApps()
  const highlighted = useHighlightedApp(apps)
  return (
    <section className="flex flex-col gap-3" aria-labelledby="pwa-hub-title">
      <div className="flex flex-col gap-1">
        <h2 id="pwa-hub-title" className="text-base font-semibold">
          {t("hub.title")}
        </h2>
        <p className="text-muted-foreground text-sm">{t("hub.subtitle")}</p>
      </div>
      <ul className="flex flex-col gap-2">
        {apps.map((app) => {
          const Icon = ICONS[app.key]
          return (
            <li
              key={app.key}
              id={`install-${app.key}`}
              data-highlighted={highlighted === app.key}
              className={cn(
                "bg-card flex scroll-mt-20 items-center gap-3 rounded-xl border p-3 transition-shadow",
                highlighted === app.key && "ring-primary border-primary ring-2",
              )}
            >
              <Icon aria-hidden className="text-primary size-6 shrink-0" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-center gap-2 text-sm font-medium">
                  {app.name}
                  {app.forStaff ? (
                    <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                      {t("hub.forStaff")}
                    </span>
                  ) : null}
                </span>
                <span className="text-muted-foreground text-xs">{app.description}</span>
              </div>
              {app.href ? (
                <a
                  href={app.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={t("hub.installLabel", { name: app.name })}
                  className={buttonVariants({ variant: "outline", className: "min-h-11 shrink-0" })}
                >
                  {t("hub.install")}
                </a>
              ) : (
                <span className="text-muted-foreground max-w-28 text-right text-xs">{t("hub.thisApp")}</span>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
