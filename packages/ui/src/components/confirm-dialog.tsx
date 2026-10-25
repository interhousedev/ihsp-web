"use client"

import { useT } from "@ihsp/i18n"
import type { ReactNode } from "react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog"
import { Button } from "./ui/button"

export type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** Red confirm button for irreversible actions. */
  destructive?: boolean
  loading?: boolean
  onConfirm: () => void | Promise<void>
  /** Extra content between the description and the buttons (a reason field, for example). */
  children?: ReactNode
}

/** "Are you sure?" dialog. It stays open while `loading`; the caller closes it when the action finished. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive = false,
  loading = false,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  const t = useT()
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelLabel ?? t("common.cancel")}</AlertDialogCancel>
          <Button variant={destructive ? "destructive" : "default"} disabled={loading} onClick={() => void onConfirm()}>
            {confirmLabel ?? t("common.confirm")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
