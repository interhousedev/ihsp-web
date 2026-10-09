"use client"

import type { SourceItem } from "@ihsp/api"
import { useMemo, useRef, useState, type RefObject } from "react"
import { matches } from "../lib/search-text"

export type SourceSearch = {
  /** The search field is open under the toolbar. */
  open: boolean
  /** What is typed in the field. */
  text: string
  /** The typed text without surrounding spaces; empty means "no filter". */
  query: string
  /** The sources are being filtered (the field is open and has a query). */
  active: boolean
  /** The sources whose titles match, or all of them when nothing is being searched. */
  shown: readonly SourceItem[]
  setText: (text: string) => void
  /** The search button of the toolbar, to give the focus back after the field closes. */
  buttonRef: RefObject<HTMLButtonElement | null>
  toggle: () => void
  /** Clears the text and closes the field. */
  close: () => void
}

/** The title search of the Sources panel: open / closed, the text and the sources that match it (all scripts). */
export function useSourceSearch(items: readonly SourceItem[]): SourceSearch {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState("")
  const buttonRef = useRef<HTMLButtonElement>(null)
  const query = text.trim()
  const active = open && query !== ""
  const shown = useMemo(
    () => (active ? items.filter((source) => matches(source.title, query)) : items),
    [active, items, query],
  )

  function close() {
    setOpen(false)
    setText("")
    buttonRef.current?.focus()
  }

  return { open, text, query, active, shown, setText, buttonRef, toggle: () => (open ? close() : setOpen(true)), close }
}
