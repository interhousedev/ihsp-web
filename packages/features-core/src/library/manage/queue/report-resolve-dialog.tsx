"use client"

import type { ReportResolveAction } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
} from "@ihsp/ui"
import { useEffect, useState } from "react"

const ACTIONS: readonly ReportResolveAction[] = ["dismiss", "hold", "unpublish", "unpublish_and_warn"]

/**
 * Decide the open reports of an item: **Dismiss** (the item stays, a held item comes back), **Hold**, **Unpublish**,
 * or **Unpublish and warn** the uploader. The result applies to every report of the item.
 */
export function ReportResolveDialog({
  open,
  title,
  pending,
  error,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  title: string
  pending: boolean
  error: unknown
  onOpenChange: (open: boolean) => void
  onSubmit: (action: ReportResolveAction) => void
}) {
  const t = useT("library.manage.resolve")
  const common = useT("common")
  const errorMessage = useErrorMessage()
  const [action, setAction] = useState<ReportResolveAction>("dismiss")

  useEffect(() => {
    if (!open) setAction("dismiss")
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description", { title })}</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit(action)
          }}
        >
          <fieldset className="flex flex-col gap-1">
            <legend className="mb-1 text-sm font-medium">{t("decision")}</legend>
            {ACTIONS.map((value) => (
              <Label
                key={value}
                className="min-h-11 cursor-pointer items-start gap-3 rounded-md px-2 py-2 font-normal md:min-h-9"
              >
                <input
                  type="radio"
                  name="report-resolve"
                  value={value}
                  checked={action === value}
                  onChange={() => setAction(value)}
                  className="mt-0.5 size-4"
                />
                <span className="flex flex-col">
                  <span className="font-medium">{t(`action.${value}.label`)}</span>
                  <span className="text-muted-foreground text-xs">{t(`action.${value}.hint`)}</span>
                </span>
              </Label>
            ))}
          </fieldset>
          {error ? (
            <p role="alert" className="text-destructive text-sm">
              {errorMessage(error)}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 md:min-h-8"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              {common("cancel")}
            </Button>
            <Button
              type="submit"
              variant={action === "dismiss" ? "default" : "destructive"}
              className="min-h-11 md:min-h-8"
              disabled={pending}
            >
              {t("confirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
