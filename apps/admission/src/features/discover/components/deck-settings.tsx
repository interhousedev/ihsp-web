"use client"

import { useT } from "@ihsp/i18n"
import {
  Button,
  Icons,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  useIsMobile,
} from "@ihsp/ui"
import { useState } from "react"
import { AlgorithmPanel } from "../../algorithm"

/** The "Settings" button of the deck: the algorithm questions in a popover on a desktop, in a bottom sheet on a phone. */
export function DeckSettings({ onSaved }: { onSaved: () => void }) {
  const t = useT("discover")
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const panel = <AlgorithmPanel onSaved={onSaved} />
  if (isMobile)
    return (
      <>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="size-11 px-0"
          aria-label={t("settings.open")}
          onClick={() => setOpen(true)}
        >
          <Icons.adjustments aria-hidden />
          <span className="sr-only">{t("settings.open")}</span>
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("settings.title")}</DialogTitle>
            </DialogHeader>
            {panel}
          </DialogContent>
        </Dialog>
      </>
    )
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button type="button" variant="outline" size="sm" />}>
        <Icons.adjustments aria-hidden />
        {t("settings.open")}
      </PopoverTrigger>
      <PopoverContent align="end" className="max-h-[min(40rem,80dvh)] w-[26rem] gap-3 overflow-y-auto p-4">
        {panel}
      </PopoverContent>
    </Popover>
  )
}
