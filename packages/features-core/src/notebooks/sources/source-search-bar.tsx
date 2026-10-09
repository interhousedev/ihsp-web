"use client"

import { useT } from "@ihsp/i18n"
import { Button, Input } from "@ihsp/ui"
import { IconSearch, IconX } from "@tabler/icons-react"
import { useEffect, useRef, type KeyboardEvent } from "react"

type SourceSearchBarProps = {
  text: string
  onChange: (text: string) => void
  /** Esc: clear the text and close the field. */
  onClose: () => void
}

/** The title search field under the toolbar: focused when it opens, a clear button, Esc closes it. */
export function SourceSearchBar({ text, onChange, onClose }: SourceSearchBarProps) {
  const t = useT("notebooks")
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    input.current?.focus()
  }, [])

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Escape") return
    event.stopPropagation()
    onClose()
  }

  return (
    <div className="relative px-3 md:px-4">
      <IconSearch
        aria-hidden
        className="text-muted-foreground pointer-events-none absolute start-5 top-1/2 size-4 -translate-y-1/2 md:start-6"
      />
      <Input
        ref={input}
        type="text"
        value={text}
        aria-label={t("sources.search")}
        placeholder={t("sources.search")}
        autoComplete="off"
        enterKeyHint="search"
        className="h-11 ps-8 pe-11 md:h-8 md:pe-8"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
      />
      {text !== "" ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute end-3 top-1/2 size-11 -translate-y-1/2 md:end-4 md:size-8"
          aria-label={t("sources.clearSearch")}
          onClick={() => {
            onChange("")
            input.current?.focus()
          }}
        >
          <IconX aria-hidden />
        </Button>
      ) : null}
    </div>
  )
}
