"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, ResponsiveDialog } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { ikigaiQuery } from "../api"
import { CIRCLES, EMPTY_IKIGAI, filledCount } from "../model"
import { IkigaiStep } from "./ikigai-step"

/** Ikigai as one row: how many of the four circles are filled, and a button that opens the Venn in a dialog. */
export function IkigaiRow() {
  const t = useT("professions")
  const [open, setOpen] = useState(false)
  const stored = useQuery(ikigaiQuery())
  const filled = filledCount(stored.data ?? EMPTY_IKIGAI)
  return (
    <>
      <div className="flex min-w-0 items-center gap-2">
        <Icons.target aria-hidden className="text-muted-foreground size-4 shrink-0" />
        <span className="min-w-0 truncate text-sm">
          <span className="font-semibold">{t("ikigaiRow.title")}</span>
          <span className="text-muted-foreground"> · {t("ikigaiRow.count", { n: filled, total: CIRCLES.length })}</span>
        </span>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          {t(filled > 0 ? "ikigaiRow.edit" : "ikigaiRow.fill")}
        </Button>
      </div>
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title={t("step.ikigai.title")}
        description={t("step.ikigai.hint")}
        size="lg"
      >
        <IkigaiStep />
      </ResponsiveDialog>
    </>
  )
}
