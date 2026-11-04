"use client"

import type { Library } from "@openuidev/react-lang"
import { Fragment, useMemo, type ReactNode } from "react"
import { OpenUiBlock, OpenUiSkeleton } from "./open-ui-block"
import { splitOpenUi } from "./split"

type Props = {
  text: string
  /** While the answer streams, an invalid closed block is a skeleton too: the backend may still repair it. */
  isStreaming?: boolean
  library: Library
  renderMarkdown: (text: string) => ReactNode
}

/** Message text with ```openui blocks drawn as components and the rest as Markdown. */
export function MessageWithOpenUi({ text, isStreaming = false, library, renderMarkdown }: Props) {
  const segments = useMemo(() => splitOpenUi(text), [text])
  if (segments.every((segment) => segment.kind === "markdown")) return <>{renderMarkdown(text)}</>
  return (
    <>
      {segments.map((segment, index) => (
        <Fragment key={index}>
          {segment.kind === "markdown" ? (
            renderMarkdown(segment.text)
          ) : segment.kind === "block" ? (
            <OpenUiBlock code={segment.code} library={library} isStreaming={isStreaming} />
          ) : (
            <OpenUiSkeleton />
          )}
        </Fragment>
      ))}
    </>
  )
}
