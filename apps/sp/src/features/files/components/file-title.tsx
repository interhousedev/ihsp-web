"use client"

import type { FileItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { toast } from "sonner"
import { fileHref, openFile } from "../utils/open-file"

/** The file name as a heading; a ready file opens when its name is clicked. */
export function FileTitle({ file, className }: { file: FileItem; className?: string }) {
  const t = useT("files.row")
  return (
    <h3 className={cn("text-sm font-medium break-words", className)}>
      {file.status === "ready" ? (
        <a
          href={fileHref(file.id)}
          className="hover:underline"
          onClick={(event) => {
            event.preventDefault()
            void openFile(file).catch(() => toast.error(t("downloadFailed")))
          }}
        >
          {file.name}
        </a>
      ) : (
        file.name
      )}
    </h3>
  )
}
