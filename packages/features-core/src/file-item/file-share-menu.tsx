"use client"

import { postLinks } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconLock,
  IconShare,
  IconWorld,
} from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

/**
 * The one share menu of a file. "Public link" is a short link anyone can open without signing in; the other entry opens
 * the panel for the link that requires sign-in and for named people. Without `onPeople` only the public link is offered.
 */
export function FileShareMenu({
  fileId,
  name,
  onPeople,
  labelled = false,
}: {
  fileId: string
  name: string
  onPeople?: () => void
  /** Shows the word next to the icon. */
  labelled?: boolean
}) {
  const t = useT("files.item")
  const errorMessage = useErrorMessage()
  const share = useMutation({
    mutationFn: () => postLinks({ kind: "file", file_id: fileId }),
    onSuccess: async (link) => {
      try {
        await navigator.clipboard.writeText(link.url)
        toast.success(t("linkCopied"))
      } catch {
        // The Telegram webview may refuse the clipboard: show the address instead.
        toast.success(link.url)
      }
    },
    onError: (error) => toast.error(errorMessage(error)),
  })
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size={labelled ? "sm" : "icon"}
            className={labelled ? "min-h-11 md:min-h-8" : "size-11 shrink-0 md:size-8"}
            aria-label={t("shareItem", { name })}
            title={t("share")}
          />
        }
      >
        <IconShare aria-hidden />
        {labelled ? t("share") : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 max-w-[calc(100vw-2rem)]">
        <DropdownMenuItem className="min-h-11 items-start" disabled={share.isPending} onClick={() => share.mutate()}>
          <IconWorld aria-hidden className="mt-0.5" />
          <span className="flex min-w-0 flex-col">
            <span>{t("publicLink")}</span>
            <span className="text-muted-foreground text-xs whitespace-normal">{t("publicHint")}</span>
          </span>
        </DropdownMenuItem>
        {onPeople ? (
          <DropdownMenuItem className="min-h-11 items-start" onClick={onPeople}>
            <IconLock aria-hidden className="mt-0.5" />
            <span className="flex min-w-0 flex-col">
              <span>{t("peopleLink")}</span>
              <span className="text-muted-foreground text-xs whitespace-normal">{t("peopleHint")}</span>
            </span>
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
