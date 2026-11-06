"use client"

import { useT } from "@ihsp/i18n"
import { Input, PageContainer, StateView } from "@ihsp/ui"
import { useEffect, useMemo, useState } from "react"
import { BackLink } from "../shell/back-link"
import { type LicensedPackage, loadLicensedPackages } from "./licenses"

const LINK = "focus-visible:ring-ring rounded-sm underline-offset-4 outline-hidden hover:underline focus-visible:ring-2"

/**
 * The open source packages on their own page (opened in a new tab from the license section). The generated list loads
 * when the page opens; it is a separate chunk, so the rest of the app does not pay for it.
 */
export function LicensePackagesPage() {
  const t = useT("license")
  const [packages, setPackages] = useState<readonly LicensedPackage[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [query, setQuery] = useState("")

  useEffect(() => {
    let active = true
    loadLicensedPackages().then(
      (loaded) => active && setPackages(loaded),
      () => active && setFailed(true),
    )
    return () => {
      active = false
    }
  }, [])

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!packages || needle === "") return packages ?? []
    return packages.filter(
      (item) => item.name.toLowerCase().includes(needle) || item.license.toLowerCase().includes(needle),
    )
  }, [packages, query])

  return (
    <PageContainer title={t("packagesShow")} width="narrow">
      {/* Opened directly or replacing the view in an installed app, this page must still have a way out. */}
      <BackLink href="/" label={t("packagesHome")} />
      {failed ? (
        <p role="alert" className="text-destructive text-sm">
          {t("loadFailed")}
        </p>
      ) : packages === null ? (
        <StateView state="loading" rows={4} />
      ) : (
        <div className="flex flex-col gap-3">
          <Input
            type="search"
            aria-label={t("search")}
            placeholder={t("search")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <p className="text-muted-foreground text-xs" aria-live="polite">
            {t("found", { count: shown.length })}
          </p>
          {shown.length === 0 ? (
            <StateView state="filtered" emptyText={t("empty")} onReset={() => setQuery("")} />
          ) : (
            <ul aria-label={t("listLabel")} className="flex flex-col divide-y text-sm">
              {shown.map((item) => (
                <li
                  key={`${item.ecosystem}:${item.name}@${item.version}`}
                  className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 py-2 md:min-h-8"
                >
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className={`${LINK} font-medium break-all`}
                  >
                    {item.name}
                  </a>
                  <span className="text-muted-foreground tabular-nums">{item.version}</span>
                  <span className="text-muted-foreground text-xs">{item.ecosystem}</span>
                  <span className="ms-auto text-end break-words">
                    {item.license === "UNKNOWN" ? t("unknown") : item.license}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </PageContainer>
  )
}
