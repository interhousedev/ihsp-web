"use client"

import type { ItemCard } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, buttonVariants, cn } from "@ihsp/ui"
import { IconExternalLink, IconFlag } from "@ihsp/ui"
import { useState } from "react"
import { useLibraryAccess } from "../hooks/use-library-access"
import { ReportDialog } from "./report-dialog"
import { ShareLink } from "./share-link"
import { ShelfButton } from "./shelf-button"

/**
 * The actions of a UniLibrary record, which is **link-only**: the one primary action **Open on UniLibrary** (a new tab,
 * `rel="noopener noreferrer"`), then Add to shelf, Share (our own page, once the record is stored) and Report. There is
 * no Read, no offline and no Add to notebook here, by design.
 */
export function ExternalActions({ item, className }: { item: ItemCard; className?: string }) {
  const t = useT("library")
  const { signedIn } = useLibraryAccess()
  const [reporting, setReporting] = useState(false)
  const external = item.external
  if (!external) return null
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {external.gone ? null : (
        <a
          href={external.view_url}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ className: "min-h-11 md:min-h-8" })}
        >
          <IconExternalLink aria-hidden />
          {t("unilibrary.open")}
        </a>
      )}
      <ShelfButton item={item} />
      <ShareLink id={item.id} slug={item.slug} />
      {item.id && signedIn ? (
        <>
          <Button type="button" variant="ghost" className="min-h-11 md:min-h-8" onClick={() => setReporting(true)}>
            <IconFlag aria-hidden />
            {t("item.report")}
          </Button>
          <ReportDialog itemId={item.id} open={reporting} onOpenChange={setReporting} />
        </>
      ) : null}
    </div>
  )
}
