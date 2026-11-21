"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { useState } from "react"
import { useAddToList, useList } from "../hooks"
import type { ListEntry } from "../types"
import { InstitutionCombobox } from "./institution-combobox"

/** The inline "Add a university" row under the list: it opens the picker and adds the pick. */
export function AddSchoolRow({ onAdded }: { onAdded?: (entry: ListEntry) => void }) {
  const t = useT("chooser")
  const errorMessage = useErrorMessage()
  const list = useList()
  const add = useAddToList()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  if (!open)
    return (
      <button
        type="button"
        className="border-hairline-strong text-muted-foreground hover:text-foreground hover:bg-muted flex min-h-11 w-full items-center gap-2 rounded-lg border border-dashed px-3 text-sm"
        onClick={() => setOpen(true)}
      >
        <Icons.add aria-hidden className="size-4" />
        {t("list.addSchool")}
      </button>
    )
  const listed = new Set(list.data?.map((entry) => entry.institution.id))
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <InstitutionCombobox
            autoFocus
            value={null}
            onChange={(picked) => {
              if (!picked || listed.has(picked.id) || pending) return
              setPending(true)
              add.mutate(
                { institution_id: picked.id },
                {
                  onSuccess: (entry) => {
                    setOpen(false)
                    onAdded?.(entry)
                  },
                  onSettled: () => setPending(false),
                },
              )
            }}
          />
        </div>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          {t("list.addCancel")}
        </Button>
      </div>
      {add.isError ? (
        <p role="alert" className="text-destructive text-xs">
          {errorMessage(add.error)}
        </p>
      ) : null}
    </div>
  )
}
