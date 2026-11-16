"use client"

import { useT } from "@ihsp/i18n"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, Spinner } from "@ihsp/ui"
import { useState } from "react"
import { HELPER_SEARCH_MIN, useHelperSearch, type Helper } from "../api"

/** Search accounts by name (from `HELPER_SEARCH_MIN` characters); the server returns at most ten. */
export function HelperSearch({ onPick }: { onPick: (helper: Helper) => void }) {
  const t = useT("help")
  const [q, setQ] = useState("")
  const search = useHelperSearch(q)
  const ready = q.trim().length >= HELPER_SEARCH_MIN

  return (
    <Command shouldFilter={false} className="rounded-card border">
      <CommandInput value={q} onValueChange={setQ} placeholder={t("helper.searchPlaceholder")} />
      <CommandList>
        {!ready ? (
          <p className="text-muted-foreground p-3 text-sm">{t("helper.minChars", { count: HELPER_SEARCH_MIN })}</p>
        ) : search.isPending ? (
          <div className="flex justify-center p-3">
            <Spinner />
          </div>
        ) : search.isError ? (
          <p role="alert" className="text-destructive p-3 text-sm">
            {t("helper.error")}
          </p>
        ) : (
          <>
            <CommandEmpty>{t("helper.none")}</CommandEmpty>
            <CommandGroup>
              {search.data.items.map((helper) => (
                <CommandItem key={helper.user_id} value={helper.user_id} onSelect={() => onPick(helper)}>
                  {helper.display_name}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </Command>
  )
}
