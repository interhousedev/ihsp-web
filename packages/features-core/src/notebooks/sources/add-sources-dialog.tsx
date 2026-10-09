"use client"

import { useT } from "@ihsp/i18n"
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  useIsMobile,
} from "@ihsp/ui"
import { IconX } from "@tabler/icons-react"
import { AddSourcesBody } from "./add-sources-body"

export type AddSourcesDialogProps = {
  notebookId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Add sources: a dialog on desktop and a full-height drawer on phones, with tabs for My files, Chats, Lessons,
 * Flash cards, Courses, Text and Link (docs/reference/notebooklm.md § 5.4.2). The selection is kept across tabs and
 * one request adds everything.
 */
export function AddSourcesDialog({ notebookId, open, onOpenChange }: AddSourcesDialogProps) {
  const t = useT("notebooks")
  const isMobile = useIsMobile()
  const body = <AddSourcesBody notebookId={notebookId} onDone={() => onOpenChange(false)} />

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-dvh max-h-dvh rounded-none">
          <DrawerHeader className="flex-row items-start justify-between gap-2 text-start">
            <div className="flex min-w-0 flex-col gap-0.5">
              <DrawerTitle>{t("add.title")}</DrawerTitle>
              <DrawerDescription>{t("add.description")}</DrawerDescription>
            </div>
            <DrawerClose
              render={
                <Button type="button" variant="ghost" size="icon" className="size-11" aria-label={t("viewer.close")} />
              }
            >
              <IconX aria-hidden />
            </DrawerClose>
          </DrawerHeader>
          <div className="flex min-h-0 flex-1 flex-col p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{body}</div>
        </DrawerContent>
      </Drawer>
    )
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(40rem,90dvh)] max-h-[90dvh] flex-col gap-3 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("add.title")}</DialogTitle>
          <DialogDescription>{t("add.description")}</DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  )
}
