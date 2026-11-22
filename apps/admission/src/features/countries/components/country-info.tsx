"use client"

import { useT } from "@ihsp/i18n"
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Icons, Skeleton } from "@ihsp/ui"
import { useState } from "react"
import { CountryFlag } from "../../profile/components/country-flag"
import { useCountryFacts } from "../api"
import { useStudentFields } from "../use-student-fields"
import { CountryCompare, CountryFactsView, useCountryName } from "./country-facts-view"

function Body({ codes }: { codes: string[] }) {
  const t = useT("countries")
  const fields = useStudentFields()
  const query = useCountryFacts(codes, fields)
  if (query.isPending) return <Skeleton className="h-32 w-full" />
  if (query.isError) return <p role="alert">{t("loadFailed")}</p>
  const items = query.data.items
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground flex items-center gap-2 py-6 text-sm">
        <Icons.info className="size-4 shrink-0" aria-hidden />
        {t("noFacts")}
      </p>
    )
  }
  return items.length === 1 ? (
    <CountryFactsView facts={items[0]!} highlight={query.data.highlight} />
  ) : (
    <CountryCompare items={items} highlight={query.data.highlight} />
  )
}

/** A centered pop-up describing one country, or comparing two or three (full height and scrolling on phones). */
export function CountryDialog({
  codes,
  open,
  onOpenChange,
}: {
  codes: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useT("countries")
  const name = useCountryName()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-sm:h-dvh sm:max-h-[85dvh] sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-8">
            {codes.length === 1 ? (
              <>
                <CountryFlag code={codes[0]!} />
                {name(codes[0]!)}
              </>
            ) : (
              t("compareTitle")
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="min-w-0">{open ? <Body codes={codes} /> : null}</div>
      </DialogContent>
    </Dialog>
  )
}

/** A small "i" button (44px target on phones) that opens the facts of one country; it never selects anything. */
export function CountryInfoButton({ code }: { code: string }) {
  const t = useT("countries")
  const name = useCountryName()
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        aria-label={t("infoAbout", { country: name(code) })}
        onClick={() => setOpen(true)}
        className="hover:bg-accent focus-visible:ring-ring/50 -my-1 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-[3px] md:size-8"
      >
        <Icons.info className="size-4" />
      </button>
      {open ? <CountryDialog codes={[code]} open onOpenChange={setOpen} /> : null}
    </>
  )
}

/** Info buttons for the chosen countries and a compare button for two or three of them. */
export function CountryInfoRow({ codes }: { codes: string[] }) {
  const t = useT("countries")
  const name = useCountryName()
  const [shown, setShown] = useState<string[] | null>(null)
  if (codes.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
      {codes.map((code) => (
        <Button
          key={code}
          type="button"
          size="sm"
          variant="outline"
          className="min-h-11 md:min-h-8"
          aria-label={t("infoAbout", { country: name(code) })}
          onClick={() => setShown([code])}
        >
          <CountryFlag code={code} />
          <Icons.info className="size-4" />
          {name(code)}
        </Button>
      ))}
      {codes.length >= 2 ? (
        <Button type="button" size="sm" className="min-h-11 md:min-h-8" onClick={() => setShown(codes.slice(0, 3))}>
          {t("compare")}
        </Button>
      ) : null}
      {shown ? <CountryDialog codes={shown} open onOpenChange={(open) => !open && setShown(null)} /> : null}
    </div>
  )
}
