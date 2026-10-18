"use client"

import { getMeFilesQuery, type FileItem, type LinkCreateBody } from "@ihsp/api"
import { FileUploadButton } from "@ihsp/features-core"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Dropdown,
  Input,
  Label,
} from "@ihsp/ui"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useId, useState } from "react"
import { toast } from "sonner"
import { useCreateLink } from "../hooks/use-my-links"
import { isHttpUrl } from "../utils/link-display"

type Mode = "url" | "file"
type NewLinkDialogProps = { open: boolean; onOpenChange: (open: boolean) => void }

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    return false
  }
}

/** New short link to a URL or to a file (pick one of My files or upload a new one); the link is copied (SL-1). */
export function NewLinkDialog({ open, onOpenChange }: NewLinkDialogProps) {
  const t = useT("links.new")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const create = useCreateLink()
  const urlId = useId()
  const fileSelectId = useId()
  const [mode, setMode] = useState<Mode>("url")
  const [url, setUrl] = useState("")
  const [fileId, setFileId] = useState("")
  const [uploaded, setUploaded] = useState<FileItem[]>([])

  const files = useQuery({ ...getMeFilesQuery({ limit: 100 }), enabled: open && mode === "file" })
  const options = [...uploaded, ...(files.data?.items ?? [])].filter(
    (file, index, all) => file.status === "ready" && all.findIndex((other) => other.id === file.id) === index,
  )

  const urlInvalid = url.trim() !== "" && !isHttpUrl(url)
  const canCreate = mode === "url" ? isHttpUrl(url) : fileId !== ""

  function reset() {
    setUrl("")
    setFileId("")
    setUploaded([])
    create.reset()
  }

  function submit() {
    if (!canCreate) return
    const body: LinkCreateBody =
      mode === "url" ? { kind: "url", target_url: url.trim() } : { kind: "file", file_id: fileId }
    create.mutate(body, {
      onSuccess: async (link) => {
        const copied = await copyText(link.url)
        toast.success(copied ? t("createdCopied", { url: link.url }) : t("created", { url: link.url }))
        reset()
        onOpenChange(false)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
          </DialogHeader>

          <div role="group" aria-label={t("mode")} className="grid grid-cols-2 gap-2">
            {(["url", "file"] as const).map((value) => (
              <Button
                key={value}
                type="button"
                variant={mode === value ? "default" : "outline"}
                className="min-h-11"
                aria-pressed={mode === value}
                onClick={() => setMode(value)}
              >
                {t(`mode_${value}`)}
              </Button>
            ))}
          </div>

          {mode === "url" ? (
            <div className="flex flex-col gap-1">
              <Label htmlFor={urlId}>{t("urlLabel")}</Label>
              <Input
                id={urlId}
                type="url"
                inputMode="url"
                placeholder="https://"
                value={url}
                aria-invalid={urlInvalid}
                className="min-h-11"
                onChange={(event) => setUrl(event.target.value)}
              />
              {urlInvalid ? <p className="text-destructive text-xs">{t("urlInvalid")}</p> : null}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor={fileSelectId}>{t("fileLabel")}</Label>
                <Dropdown
                  id={fileSelectId}
                  value={fileId}
                  className="w-full"
                  placeholder={files.isPending ? t("loadingFiles") : t("chooseFile")}
                  onValueChange={setFileId}
                  options={options.map((file) => ({ value: file.id, label: file.name }))}
                />
              </div>
              <p className="text-muted-foreground text-xs">{t("or")}</p>
              <FileUploadButton
                purpose="link"
                label={t("uploadNew")}
                onUploaded={(file) => {
                  setUploaded((current) => [file, ...current])
                  setFileId(file.id)
                }}
                onSettled={() => void queryClient.invalidateQueries({ queryKey: ["me", "files"] })}
              />
            </div>
          )}

          {create.isError ? (
            <p role="alert" className="text-destructive text-sm">
              {errorMessage(create.error)}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" className="min-h-11" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" className="min-h-11" disabled={!canCreate || create.isPending}>
              {t("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
