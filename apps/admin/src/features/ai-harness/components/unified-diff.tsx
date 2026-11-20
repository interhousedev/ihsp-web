"use client"

import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"

/** A unified diff as colored lines; headers and hunk marks are muted. */
export function UnifiedDiff({ diff }: { diff: string }) {
  const t = useT("aiHarness")
  if (diff.trim() === "") return <p className="text-muted-foreground text-sm">{t("diff.same")}</p>
  return (
    <pre
      aria-label={t("diff.title")}
      className="bg-muted max-h-96 overflow-auto rounded-md p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap"
    >
      {diff.split("\n").map((line, index) => {
        const header = line.startsWith("+++") || line.startsWith("---") || line.startsWith("@@")
        return (
          <div
            key={index}
            className={cn(
              header && "text-muted-foreground",
              !header && line.startsWith("+") && "bg-success-muted",
              !header && line.startsWith("-") && "bg-destructive-muted",
            )}
          >
            {line}
          </div>
        )
      })}
    </pre>
  )
}
