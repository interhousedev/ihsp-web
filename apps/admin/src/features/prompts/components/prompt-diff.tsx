"use client"

import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { diffLines } from "../utils"

/** The text in force against the built-in text, line by line. */
export function PromptDiff({ builtin, text }: { builtin: string; text: string }) {
  const t = useT("prompts")
  if (builtin === text) return <p className="text-muted-foreground text-sm">{t("diff.same")}</p>
  return (
    <pre
      aria-label={t("diff.title")}
      className="bg-muted max-h-96 overflow-auto rounded-md p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap"
    >
      {diffLines(builtin, text).map((line, index) => (
        <div
          key={index}
          data-kind={line.kind}
          className={cn(
            line.kind === "added" && "bg-success-muted",
            line.kind === "removed" && "bg-destructive-muted line-through",
          )}
        >
          {line.kind === "added" ? "+ " : line.kind === "removed" ? "- " : "  "}
          {line.text}
        </div>
      ))}
    </pre>
  )
}
