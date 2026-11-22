"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, Sheet, SheetContent, SheetHeader, SheetTitle, Skeleton } from "@ihsp/ui"
import { useState } from "react"
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
  if (items.length === 0) return <p>{t("noFacts")}</p>
  return items.length === 1 ? (
    <CountryFactsView facts={items[0]!} highlight={query.data.highlight} />
  ) : (
    <CountryCompare items={items} highlight={query.data.highlight} />
  )
}

/** A sheet describing one country, or comparing two or three. */
export function CountrySheet({
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto data-[side=right]:sm:max-w-4xl">
        <SheetHeader>
          <SheetTitle>{codes.length === 1 ? name(codes[0]!) : t("compareTitle")}</SheetTitle>
        </SheetHeader>
        <div className="p-4">{open ? <Body codes={codes} /> : null}</div>
      </SheetContent>
    </Sheet>
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
          <Icons.info className="size-4" />
          {name(code)}
        </Button>
      ))}
      {codes.length >= 2 ? (
        <Button type="button" size="sm" className="min-h-11 md:min-h-8" onClick={() => setShown(codes.slice(0, 3))}>
          {t("compare")}
        </Button>
      ) : null}
      {shown ? <CountrySheet codes={shown} open onOpenChange={(open) => !open && setShown(null)} /> : null}
    </div>
  )
}
