"use client"

import type { FileItem } from "@ihsp/api"
import { useFileOpener } from "@ihsp/features-core"
import { cn } from "@ihsp/ui"
import { fileAddress, fileHref } from "../utils/open-file"

/** The file name as a heading; a ready file opens when its name is clicked. */
export function FileTitle({ file, className }: { file: FileItem; className?: string }) {
  const { open } = useFileOpener()
  return (
    <h3 className={cn("text-sm font-medium break-words", className)}>
      {file.status === "ready" ? (
        <a
          href={fileHref(file.id)}
          className="hover:underline"
          onClick={(event) => {
            event.preventDefault()
            void open(() => fileAddress(file))
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
