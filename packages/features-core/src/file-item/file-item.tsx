"use client"

import { Icons, cn } from "@ihsp/ui"
import type { ComponentProps, ReactNode } from "react"
import { contentTypeOfName } from "../file-upload-button/drive-picker/file-kind"
import { FileKindIcon } from "../file-upload-button/drive-picker/file-visual"

type FileItemProps = Omit<ComponentProps<"div">, "children" | "title"> & {
  name: string
  /** Null for a web link, which gets the link icon; left out, the type is guessed from the name's extension. */
  contentType?: string | null
  /** Details joined with " · "; empty ones are dropped. */
  meta?: readonly (string | null | undefined)[]
  /** An extra details line with links or other markup. */
  details?: ReactNode
  /** A status badge next to the name. */
  badge?: ReactNode
  /** Shown instead of the type icon, for images. */
  thumbnailUrl?: string | null
  /** What the thumbnail shows; the file name unless given. */
  thumbnailAlt?: string
  /** The name itself as a link or a button that opens the file. */
  title?: ReactNode
  actions?: ReactNode
  as?: "div" | "li"
}

/**
 * One file or material in a list: type icon, name, details, actions. The actions wrap under the name on a narrow phone
 * instead of squeezing it.
 */
export function FileItem({
  name,
  contentType,
  meta = [],
  details,
  badge,
  thumbnailUrl,
  thumbnailAlt,
  title,
  actions,
  as = "div",
  className,
  ...rest
}: FileItemProps) {
  const line = meta.filter(Boolean).join(" · ")
  const Root = as as "div"
  const type = contentType === undefined ? contentTypeOfName(name) : contentType
  return (
    <Root
      {...rest}
      className={cn("flex min-h-11 flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border p-2", className)}
    >
      <div className="flex min-w-40 flex-1 items-center gap-3">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={thumbnailAlt ?? name}
            loading="lazy"
            className="size-10 shrink-0 rounded object-cover"
          />
        ) : type ? (
          <FileKindIcon file={{ content_type: type }} className="text-muted-foreground" />
        ) : (
          <Icons.links className="text-muted-foreground size-5 shrink-0" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm font-medium">
            <div className="min-w-0 truncate">{title ?? name}</div>
            {badge}
          </div>
          {line ? <p className="text-muted-foreground truncate text-xs">{line}</p> : null}
          {details}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-1">{actions}</div> : null}
    </Root>
  )
}
