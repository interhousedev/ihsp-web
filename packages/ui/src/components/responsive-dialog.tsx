"use client"

import { useT } from "@ihsp/i18n"
import { useState, type ComponentProps, type FormEventHandler, type ReactNode } from "react"
import { useIsMobile } from "../hooks/use-mobile"
import { cn } from "../lib/utils"
import { IconX } from "./icons"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerVirtualKeyboardProvider,
} from "./ui/drawer"

export type ResponsiveDialogSize = "sm" | "md" | "lg"

const DESKTOP_WIDTH: Record<ResponsiveDialogSize, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-3xl",
}

export type ResponsiveDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  /** Buttons under the scrolling body. */
  footer?: ReactNode
  /** Width on a desktop; a phone always gets a full-width bottom sheet. */
  size?: ResponsiveDialogSize
  /** Wraps the body and the footer in a form, so Enter submits and footer buttons can be `type="submit"`. */
  onSubmit?: FormEventHandler<HTMLFormElement>
  noValidate?: boolean
  /** Extra classes of the desktop dialog, only for what a size preset cannot express. */
  className?: string
  bodyClassName?: string
  initialFocus?: ComponentProps<typeof DialogContent>["initialFocus"]
  finalFocus?: ComponentProps<typeof DialogContent>["finalFocus"]
  /** Keeps the dialog open on an outside click (a form with unsaved work, an action in flight). */
  disablePointerDismissal?: boolean
  showCloseButton?: boolean
  children: ReactNode
}

/**
 * A dialog on a desktop and a bottom sheet on a phone, with a title, a scrolling body and a footer.
 *
 * The form factor is fixed while open: rotating a phone across the breakpoint must not remount the body, which would
 * drop its local state and focus. The sheet uses Base UI's virtual keyboard provider, so a focused field stays above
 * the keyboard in webviews that do not resize the layout viewport (the Telegram mini app on iOS).
 */
export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  footer,
  size = "md",
  onSubmit,
  noValidate,
  className,
  bodyClassName,
  initialFocus,
  finalFocus,
  disablePointerDismissal,
  showCloseButton = true,
  children,
}: ResponsiveDialogProps) {
  const t = useT()
  const isMobile = useIsMobile()
  const [sheet, setSheet] = useState(isMobile)
  if (!open && sheet !== isMobile) setSheet(isMobile)

  const inForm = (content: ReactNode) =>
    onSubmit ? (
      <form className="contents" noValidate={noValidate} onSubmit={onSubmit}>
        {content}
      </form>
    ) : (
      content
    )

  if (sheet) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} disablePointerDismissal={disablePointerDismissal}>
        <DrawerVirtualKeyboardProvider>
          <DrawerContent initialFocus={initialFocus} finalFocus={finalFocus}>
            <DrawerHeader className="relative pe-14 text-start">
              <DrawerTitle>{title}</DrawerTitle>
              {description ? <DrawerDescription>{description}</DrawerDescription> : null}
              {showCloseButton ? (
                <DrawerClose
                  render={
                    <Button type="button" variant="ghost" size="icon" className="absolute end-1.5 top-1.5 size-11" />
                  }
                >
                  <IconX aria-hidden />
                  <span className="sr-only">{t("common.close")}</span>
                </DrawerClose>
              ) : null}
            </DrawerHeader>
            {inForm(
              <>
                <div
                  className={cn(
                    "flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-4",
                    !footer && "pb-[calc(1rem+var(--safe-bottom))]",
                    bodyClassName,
                  )}
                >
                  {children}
                </div>
                {footer ? (
                  <DrawerFooter className="pt-2 pb-[calc(1rem+var(--safe-bottom))]">{footer}</DrawerFooter>
                ) : null}
              </>,
            )}
          </DrawerContent>
        </DrawerVirtualKeyboardProvider>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} disablePointerDismissal={disablePointerDismissal}>
      <DialogContent
        showCloseButton={showCloseButton}
        initialFocus={initialFocus}
        finalFocus={finalFocus}
        className={cn(
          "max-h-[calc(100dvh-2rem)]",
          footer ? "grid-rows-[auto_minmax(0,1fr)_auto]" : "grid-rows-[auto_minmax(0,1fr)]",
          DESKTOP_WIDTH[size],
          className,
        )}
      >
        <DialogHeader className="pe-8">
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {inForm(
          <>
            {/* The negative margin and padding keep the focus rings of the fields from being clipped by the scroller. */}
            <div className={cn("-m-1 flex min-h-0 flex-col gap-4 overflow-y-auto p-1", bodyClassName)}>{children}</div>
            {footer ? <DialogFooter>{footer}</DialogFooter> : null}
          </>,
        )}
      </DialogContent>
    </Dialog>
  )
}
