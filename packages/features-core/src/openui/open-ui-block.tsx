"use client"

import { useT } from "@ihsp/i18n"
import { Skeleton } from "@ihsp/ui"
import { createParser, Renderer, type Library } from "@openuidev/react-lang"
import { Component, useMemo, type ReactNode } from "react"
import { stringsInBlock } from "./safe"

/** True when the block parses to a tree with no validation errors and no missing references. */
function isRenderable(code: string, library: Library): boolean {
  try {
    const result = createParser(library.toJSONSchema(), library.root).parse(code)
    return result.root !== null && result.meta.errors.length === 0 && result.meta.unresolved.length === 0
  } catch {
    return false
  }
}

function BlockFallback({ code }: { code: string }) {
  const t = useT("openui")
  const lines = stringsInBlock(code)
  return (
    <div role="note" className="bg-muted/40 text-muted-foreground my-2 rounded-lg border p-3 text-sm">
      <p className="font-medium">{t("error")}</p>
      {lines.length > 0 ? (
        <ul className="mt-1 list-disc ps-5">
          {lines.map((line, index) => (
            <li key={index} className="break-words">
              {line}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

class Boundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

/** Placeholder for a block that is still being written. */
export function OpenUiSkeleton() {
  const t = useT("openui")
  return <Skeleton role="status" aria-label={t("loading")} className="my-2 h-24 w-full" />
}

/** A complete ```openui block: rendered with the library, or degraded to its readable text when it is invalid. */
export function OpenUiBlock({ code, library }: { code: string; library: Library }) {
  const ok = useMemo(() => isRenderable(code, library), [code, library])
  const fallback = <BlockFallback code={code} />
  if (!ok) return fallback
  return (
    <Boundary fallback={fallback}>
      <Renderer response={code} library={library} isStreaming={false} />
    </Boundary>
  )
}
