"use client"

import { getFileUrlQuery, type FileItem as ApiFile } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { isMiniApp } from "@ihsp/telegram/core"
import { Button, IconDownload, IconEye, buttonVariants, cn } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { Suspense, lazy, useEffect, useState, type MouseEvent } from "react"
import { toast } from "sonner"
import { previewKindOf } from "../notebooks/sources/source-file-preview"
import { openFileUrl } from "./open-file-url"

const SourceFileDialog = lazy(() =>
  import("../notebooks/sources/source-file-dialog").then((m) => ({ default: m.SourceFileDialog })),
)

/** Presigned links live 60 seconds; ask again after half of it. */
const URL_STALE_MS = 30_000

/** The single way to open a file behind a presigned address: one message on failure, one pending state. */
export function useFileOpener(onError?: (error: unknown) => void, errorText?: (error: unknown) => string) {
  const t = useT("files.item")
  const [pending, setPending] = useState(false)
  async function open(resolve: () => Promise<string>) {
    setPending(true)
    try {
      await openFileUrl(await resolve())
    } catch (error) {
      toast.error(errorText ? errorText(error) : t("openFailed"))
      onError?.(error)
    } finally {
      setPending(false)
    }
  }
  return { open, pending }
}

/** Download icon button: asks for a fresh address only when pressed. */
export function FileDownloadButton({
  resolve,
  onError,
  errorText,
  className,
}: {
  resolve: () => Promise<string>
  onError?: (error: unknown) => void
  /** Where the reason matters (access was withdrawn), the backend's translated error instead of the generic one. */
  errorText?: (error: unknown) => string
  className?: string
}) {
  const t = useT("files.item")
  const { open, pending } = useFileOpener(onError, errorText)
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn("size-11 shrink-0 md:size-8", className)}
      aria-label={t("download")}
      title={t("download")}
      disabled={pending}
      onClick={() => void open(resolve)}
    >
      <IconDownload aria-hidden />
    </Button>
  )
}

/** A link leaving the app: a plain safe anchor, through the Telegram SDK inside the mini app. */
export function fileLinkProps(href: string) {
  return {
    href,
    target: "_blank",
    rel: "noopener noreferrer",
    onClick: (event: MouseEvent) => {
      if (!isMiniApp()) return
      event.preventDefault()
      void openFileUrl(href)
    },
  } as const
}

/** "Open" for a material behind a short link. */
export function FileOpenLink({ href, title, className }: { href: string; title: string; className?: string }) {
  const t = useT("files.item")
  return (
    <a
      {...fileLinkProps(href)}
      className={cn(buttonVariants({ variant: "outline" }), "min-h-11 shrink-0 md:min-h-8", className)}
      aria-label={t("openItem", { title })}
    >
      {t("open")}
    </a>
  )
}

/** True for files the preview window can show (images, PDFs, video and audio). */
export function canPreviewFile(file: ApiFile | null | undefined): file is ApiFile {
  return Boolean(file) && previewKindOf(file as ApiFile) !== "card"
}

/** Preview icon button: the notebooks' preview window over an inline address of the file. */
export function FilePreviewButton({ file, title }: { file: ApiFile; title: string }) {
  const t = useT("files.item")
  const [open, setOpen] = useState(false)
  const url = useQuery({
    ...getFileUrlQuery(file.id, { disposition: "inline" }),
    enabled: open,
    staleTime: URL_STALE_MS,
    // A new link would restart a playing video or a scrolled PDF; the open dialog keeps the first one.
    refetchOnWindowFocus: false,
  })
  const failed = open && url.isError
  useEffect(() => {
    if (!failed) return
    toast.error(t("openFailed"))
    setOpen(false)
  }, [failed, t])
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-11 shrink-0 md:size-8"
        aria-label={t("previewItem", { title })}
        title={t("preview")}
        disabled={open && url.isPending}
        onClick={() => setOpen(true)}
      >
        <IconEye aria-hidden />
      </Button>
      {open && url.data ? (
        <Suspense fallback={null}>
          <SourceFileDialog kind={previewKindOf(file)} file={file} url={url.data.url} open onOpenChange={setOpen} />
        </Suspense>
      ) : null}
    </>
  )
}
