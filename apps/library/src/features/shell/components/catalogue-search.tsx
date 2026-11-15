"use client"

import { browseHref } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Icons, Input } from "@ihsp/ui"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"

/** The search field of the sidebar and of the phone "More" sheet: submits to the browse page, which runs the search. */
export function CatalogueSearch() {
  const t = useT("shell")
  const router = useRouter()
  const [value, setValue] = useState("")

  function submit(event: FormEvent) {
    event.preventDefault()
    const q = value.trim()
    if (q) router.push(browseHref({ q }))
  }

  return (
    <form role="search" onSubmit={submit} className="relative">
      <Icons.search
        aria-hidden
        className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2"
      />
      <Input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        aria-label={t("searchLabel")}
        placeholder={t("searchLabel")}
        enterKeyHint="search"
        className="min-h-11 ps-9 md:min-h-8"
      />
    </form>
  )
}
