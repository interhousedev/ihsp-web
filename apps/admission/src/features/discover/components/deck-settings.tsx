"use client"

import { useT } from "@ihsp/i18n"
import {
  Button,
  Icons,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
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
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Icons.adjustments aria-hidden />
          {t("settings.open")}
        </Button>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" className="max-h-[88dvh] overflow-y-auto p-4">
            <SheetHeader className="p-0">
              <SheetTitle>{t("settings.title")}</SheetTitle>
            </SheetHeader>
            {panel}
          </SheetContent>
        </Sheet>
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
