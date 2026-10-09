"use client"

import type { Block } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Icons } from "@ihsp/ui"
import { useState } from "react"
import { STEP_TYPES, STEP_TYPE_GROUPS } from "../utils/step-types"

/** "Add block": opens the step type picker, grouped like Stepik's "Choose a step type" dialog (LMS-2). */
export function AddBlockBar({ onAdd }: { onAdd: (block: Block) => void }) {
  const t = useT("stepEditor")
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant="outline" onClick={() => setOpen(true)} className="w-fit min-h-11 md:min-h-8">
        <Icons.add aria-hidden />
        {t("addBlock")}
      </Button>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("typePicker.title")}</DialogTitle>
          <DialogDescription>{t("typePicker.description")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-5">
          {STEP_TYPE_GROUPS.map((group) => (
            <section key={group} aria-labelledby={`step-type-group-${group}`} className="flex flex-col gap-2">
              <h3 id={`step-type-group-${group}`} className="text-sm font-semibold">
                {t(`typePicker.groups.${group}`)}
              </h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {STEP_TYPES.filter((type) => type.group === group).map((type) => {
                  const Icon = Icons[type.icon]
                  return (
                    <li key={type.id}>
                      <button
                        type="button"
                        data-step-type={type.id}
                        onClick={() => {
                          onAdd(type.create())
                          setOpen(false)
                        }}
                        className="hover:bg-muted/60 focus-visible:ring-ring flex min-h-11 w-full items-start gap-3 rounded-lg border p-3 text-start outline-none focus-visible:ring-2"
                      >
                        <Icon aria-hidden className="text-primary mt-0.5 size-5 shrink-0" />
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span className="text-sm font-medium">{t(`typePicker.types.${type.id}.title`)}</span>
                          <span className="text-muted-foreground text-xs">
                            {t(`typePicker.types.${type.id}.description`)}
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
