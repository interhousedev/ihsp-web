"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, Input, Label } from "@ihsp/ui"
import { useId, useState, type KeyboardEvent } from "react"
import { isHttpUrl } from "./entries"

/**
 * A plain link is always possible as an entry: an address (http or https) and the title shown in the list. It sits
 * inside the editor's form, so it is a group with its own button (a nested form would submit the whole list); Enter in
 * a field adds the link.
 */
export function EntryLinkForm({ full, onAdd }: { full: boolean; onAdd: (title: string, url: string) => void }) {
  const t = useT("library.listEditor.link")
  const ids = { title: useId(), url: useId() }
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [showProblems, setShowProblems] = useState(false)
  const titleMissing = title.trim() === ""
  const urlInvalid = !isHttpUrl(url)

  function add() {
    setShowProblems(true)
    if (titleMissing || urlInvalid || full) return
    onAdd(title, url)
    setTitle("")
    setUrl("")
    setShowProblems(false)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return
    event.preventDefault()
    add()
  }

  return (
    <div role="group" aria-label={t("title")} className="flex flex-col gap-3">
      <h3 className="text-base font-semibold">{t("title")}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={ids.title}>{t("titleLabel")}</Label>
          <Input
            id={ids.title}
            value={title}
            maxLength={200}
            aria-invalid={showProblems && titleMissing}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={onKeyDown}
          />
          {showProblems && titleMissing ? (
            <p role="alert" className="text-destructive text-sm">
              {t("titleRequired")}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={ids.url}>{t("urlLabel")}</Label>
          <Input
            id={ids.url}
            type="url"
            inputMode="url"
            value={url}
            placeholder="https://"
            aria-invalid={showProblems && urlInvalid}
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={onKeyDown}
          />
          {showProblems && urlInvalid ? (
            <p role="alert" className="text-destructive text-sm">
              {t("urlInvalid")}
            </p>
          ) : null}
        </div>
      </div>
      <Button type="button" variant="outline" className="min-h-11 self-start" disabled={full} onClick={add}>
        <Icons.add aria-hidden />
        {t("add")}
      </Button>
    </div>
  )
}
