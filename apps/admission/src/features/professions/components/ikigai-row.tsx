"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, ResponsiveDialog } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { ikigaiQuery } from "../api"
import { CIRCLES, EMPTY_IKIGAI, filledCount } from "../model"
import { IkigaiStep } from "./ikigai-step"
import { ToolCard } from "./tool-card"

/** Ikigai as a tool card: how many of the four circles are filled, and a button that opens the Venn in a dialog. */
export function IkigaiRow({ step }: { step: number }) {
  const t = useT("professions")
  const [open, setOpen] = useState(false)
  const stored = useQuery(ikigaiQuery())
  const filled = filledCount(stored.data ?? EMPTY_IKIGAI)
  return (
    <>
      <ToolCard
        icon={Icons.target}
        step={step}
        title={t("ikigaiRow.title")}
        hint={t("ikigaiRow.hint")}
        status={t("ikigaiRow.count", { n: filled, total: CIRCLES.length })}
        done={filled >= CIRCLES.length}
        action={
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
            {t(filled > 0 ? "ikigaiRow.edit" : "ikigaiRow.fill")}
          </Button>
        }
      />
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
