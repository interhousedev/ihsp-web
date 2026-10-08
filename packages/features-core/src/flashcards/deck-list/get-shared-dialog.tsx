"use client"

import { useT } from "@ihsp/i18n"
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@ihsp/ui"
import { useId, useState } from "react"
import { parseShareInput } from "../utils/share-input"

export type GetSharedDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called with the share slug found in what the student pasted. */
  onSubmit: (slug: string) => void
}

/** "Get shared": paste the link (or the code) of a shared deck to copy it to your decks. */
export function GetSharedDialog({ open, onOpenChange, onSubmit }: GetSharedDialogProps) {
  const t = useT("flashcards.getShared")
  const inputId = useId()
  const [value, setValue] = useState("")
  const [invalid, setInvalid] = useState(false)

  function submit() {
    const slug = parseShareInput(value)
    if (!slug) {
      setInvalid(true)
      return
    }
    setInvalid(false)
    onOpenChange(false)
    setValue("")
    onSubmit(slug)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1">
            <Label htmlFor={inputId}>{t("label")}</Label>
            <Input
              id={inputId}
              value={value}
              className="min-h-11"
              autoFocus
              aria-invalid={invalid}
              onChange={(event) => setValue(event.target.value)}
            />
            {invalid ? (
              <p role="alert" className="text-destructive text-sm">
                {t("invalid")}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="min-h-11" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" className="min-h-11">
              {t("copy")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
