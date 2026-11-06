"use client"

import { useT } from "@ihsp/i18n"
import { Button, Input, Label, ResponsiveDialog } from "@ihsp/ui"
import { useEffect, useState } from "react"
import { parsePageParam } from "./lib/locator"

/** "Go to page" (key `g`): a number from 1 to the page count. */
export function GoToPageDialog({
  open,
  onOpenChange,
  pages,
  current,
  onGo,
}: {
  open: boolean
  onOpenChange(open: boolean): void
  pages: number
  current: number
  onGo(page: number): void
}) {
  const t = useT("library.reader")
  const [value, setValue] = useState(String(current))
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    if (open) {
      setValue(String(current))
      setInvalid(false)
    }
  }, [open, current])

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("goToPage")}
      description={t("goToPageHint", { pages })}
      size="sm"
      onSubmit={(event) => {
        event.preventDefault()
        const page = parsePageParam(value)
        if (page === null || page > pages) {
          setInvalid(true)
          return
        }
        onGo(page)
        onOpenChange(false)
      }}
      footer={
        <Button type="submit" className="min-h-11 md:min-h-8">
          {t("go")}
        </Button>
      }
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reader-goto">{t("goToPageLabel")}</Label>
        <Input
          id="reader-goto"
          inputMode="numeric"
          autoFocus
          value={value}
          aria-invalid={invalid}
          aria-describedby={invalid ? "reader-goto-error" : undefined}
          onChange={(event) => {
            setValue(event.target.value)
            setInvalid(false)
          }}
          onFocus={(event) => event.target.select()}
          className="min-h-11 md:min-h-8"
        />
        {invalid ? (
          <p id="reader-goto-error" role="alert" className="text-destructive text-sm">
            {t("goToPageInvalid", { pages })}
          </p>
        ) : null}
      </div>
    </ResponsiveDialog>
  )
}
