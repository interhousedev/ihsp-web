"use client"

import type { Library } from "@openuidev/react-lang"
import { Fragment, useMemo, type ReactNode } from "react"
import { OpenUiBlock, OpenUiSkeleton } from "./open-ui-block"
import { splitOpenUi } from "./split"

type Props = {
  text: string
  /** Kept for callers that stream; a pending (unclosed) fence is a skeleton either way. */
  isStreaming?: boolean
  library: Library
  renderMarkdown: (text: string) => ReactNode
}

/** Message text with ```openui blocks drawn as components and the rest as Markdown. */
export function MessageWithOpenUi({ text, library, renderMarkdown }: Props) {
  const segments = useMemo(() => splitOpenUi(text), [text])
  if (segments.every((segment) => segment.kind === "markdown")) return <>{renderMarkdown(text)}</>
  return (
    <>
      {segments.map((segment, index) => (
        <Fragment key={index}>
          {segment.kind === "markdown" ? (
            renderMarkdown(segment.text)
          ) : segment.kind === "block" ? (
            <OpenUiBlock code={segment.code} library={library} />
          ) : (
            <OpenUiSkeleton />
          )}
        </Fragment>
      ))}
    </>
  )
}
