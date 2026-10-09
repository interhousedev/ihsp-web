import type { ReactNode } from "react"

/** A fenced code block of `Markdown`, with its language (```` ```python ````) shown above the code. */
export function MarkdownCodeBlock({ language, children }: { language: string | null; children?: ReactNode }) {
  return (
    <div className="bg-muted my-2 overflow-hidden rounded-md" data-language={language ?? undefined}>
      {language ? (
        <div className="text-muted-foreground border-border/60 border-b px-3 py-1 font-mono text-[11px] select-none">
          {language}
        </div>
      ) : null}
      <pre className="overflow-x-auto p-3 text-xs">{children}</pre>
    </div>
  )
}
