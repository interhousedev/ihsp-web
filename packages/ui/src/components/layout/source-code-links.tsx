"use client"

import { useT } from "@ihsp/i18n"
import { cn } from "../../lib/utils"

/** Public repositories of the web apps and the backend (AGPL-3.0 section 13 offer). */
export const SOURCE_CODE_WEB_URL = "https://github.com/interhousedev/ihsp-web"
export const SOURCE_CODE_BACKEND_URL = "https://github.com/interhousedev/ihsp-backend"

/** A small, quiet pair of links to the source code, shown in every app's footer. */
export function SourceCodeLinks({ className }: { className?: string }) {
  const t = useT()
  const linkClass = "text-muted-foreground inline-flex min-h-11 items-center text-xs underline-offset-4 hover:underline"
  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-x-4", className)}>
      <a href={SOURCE_CODE_WEB_URL} target="_blank" rel="noopener" className={linkClass}>
        {t("common.sourceCodeWeb")}
      </a>
      <a href={SOURCE_CODE_BACKEND_URL} target="_blank" rel="noopener" className={linkClass}>
        {t("common.sourceCodeBackend")}
      </a>
    </div>
  )
}
