"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ihsp/ui"
import { useState } from "react"
import { toast } from "sonner"
import { useUploadDocument } from "../api"
import { useWorkflow } from "../../../lib/config"
import { FilePickButton } from "./file-pick-button"

/** Picks a kind and a file, then POST /documents (multipart). */
export function UploadForm() {
  const t = useT("documents")
  const errorMessage = useErrorMessage()
  const upload = useUploadDocument()
  const workflow = useWorkflow()
  const [kind, setKind] = useState<string>("other")
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={kind} onValueChange={(value) => value && setKind(value)}>
        <SelectTrigger aria-label={t("kindLabel")} className="min-h-11 w-48 md:min-h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {workflow.document_kinds.map(({ id: value }) => (
            <SelectItem key={value} value={value}>
              {t(`kind.${value}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FilePickButton
        label={t("upload")}
        disabled={upload.isPending}
        onPick={(file) =>
          upload.mutate(
            { kind, file },
            {
              onSuccess: () => toast.success(t("uploaded")),
              onError: (error) => toast.error(errorMessage(error)),
            },
          )
        }
      />
    </div>
  )
}
