"use client"

import type { FileItem } from "@ihsp/api"
import { FilePicker, FileUploadButton } from "@ihsp/features-core"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Icons,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@ihsp/ui"
import { useState } from "react"
import { useAddAttachment } from "../hooks/use-lesson"

/**
 * "Add attachment" (WEB-10, UF-WEB-07): a file (upload or pick from My files) or a link, for lessons of the
 * student's audience inside the window. The lesson page shows the button only when `can_attach` is true.
 */
export function AddAttachmentDialog({ lessonId }: { lessonId: string }) {
  const t = useT("lesson.attach")
  const errorMessage = useErrorMessage()
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState("")
  const add = useAddAttachment(lessonId)

  function finish() {
    setOpen(false)
    setUrl("")
    add.reset()
  }

  function attachFile(file: FileItem) {
    add.mutate({ kind: "file", file_id: file.id }, { onSuccess: finish })
  }

  function attachUrl() {
    add.mutate({ kind: "url", target_url: url.trim() }, { onSuccess: finish })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="min-h-11 md:min-h-8" />}>
        <Icons.add aria-hidden />
        {t("button")}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="file">
          <TabsList className="h-auto min-h-11 w-full">
            <TabsTrigger value="file" className="min-h-11">
              {t("tabs.file")}
            </TabsTrigger>
            <TabsTrigger value="link" className="min-h-11">
              {t("tabs.link")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="file" className="flex flex-col gap-3 pt-3">
            <FileUploadButton purpose="link" onUploaded={attachFile} label={t("upload")} />
            <p className="text-sm font-medium">{t("pickFromFiles")}</p>
            <FilePicker onPick={attachFile} disabled={add.isPending} enabled={open} />
          </TabsContent>
          <TabsContent value="link" className="pt-3">
            <form
              className="flex flex-col gap-3"
              onSubmit={(event) => {
                event.preventDefault()
                if (url.trim() !== "") attachUrl()
              }}
            >
              <Input
                type="url"
                inputMode="url"
                required
                value={url}
                placeholder="https://"
                aria-label={t("url")}
                className="h-11 md:h-8"
                onChange={(event) => setUrl(event.target.value)}
              />
              <Button type="submit" className="min-h-11 md:min-h-8" disabled={add.isPending || url.trim() === ""}>
                {t("addLink")}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        {add.isError ? (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage(add.error)}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
