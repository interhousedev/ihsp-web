"use client"

import type { ResourceItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"

/** The homework files EMIS attached to the lesson, as links. */
export function EmisFiles({ files }: { files: ResourceItem[] }) {
  const t = useT("homework")
  if (files.length === 0) return null
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-muted-foreground">{t("emisFiles")}</span>
      <ul className="flex flex-col gap-0.5">
        {files.map((file) => (
          <li key={file.link_id} className="min-w-0 truncate">
            <a
              href={file.short_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2"
            >
              {file.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
