"use client"

import { useT } from "@ihsp/i18n"
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldError,
  FieldLabel,
  Input,
} from "@ihsp/ui"
import { type FormEvent, type RefObject, useId, useRef, useState } from "react"
import { normalizeUrl } from "../utils/markdown/link-format"

/**
 * Adds or edits a link: its text and address. Only web (`https://`), mail (`mailto:`) and same-site (`/…`, `#…`)
 * addresses are accepted; a bare domain gets `https://`.
 */
export function LinkDialog({
  initial,
  editing,
  onSubmit,
  onRemove,
  onCancel,
  returnFocus,
}: {
  initial: { text: string; url: string }
  editing: boolean
  onSubmit: (text: string, url: string) => void
  onRemove: () => void
  onCancel: () => void
  returnFocus: RefObject<HTMLElement | null>
}) {
  const t = useT("markdownEditor.linkDialog")
  const id = useId()
  const urlField = useRef<HTMLInputElement>(null)
  const [text, setText] = useState(initial.text)
  const [url, setUrl] = useState(initial.url)
  const [invalid, setInvalid] = useState(false)

  function submit(event: FormEvent) {
    event.preventDefault()
    const normalized = normalizeUrl(url)
    if (!normalized) {
      setInvalid(true)
      urlField.current?.focus()
      return
    }
    onSubmit(text, normalized)
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent initialFocus={initial.text === "" || editing ? undefined : urlField} finalFocus={returnFocus}>
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <DialogHeader>
            <DialogTitle>{editing ? t("editTitle") : t("title")}</DialogTitle>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor={`${id}-text`}>{t("text")}</FieldLabel>
            <Input
              id={`${id}-text`}
              value={text}
              onChange={(event) => setText(event.target.value)}
              className="h-11 md:h-8"
            />
          </Field>
          <Field data-invalid={invalid || undefined}>
            <FieldLabel htmlFor={`${id}-url`}>{t("url")}</FieldLabel>
            <Input
              ref={urlField}
              id={`${id}-url`}
              value={url}
              onChange={(event) => {
                setUrl(event.target.value)
                setInvalid(false)
              }}
              inputMode="url"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="https://"
              aria-invalid={invalid}
              aria-describedby={invalid ? `${id}-url-error` : undefined}
              className="h-11 md:h-8"
            />
            {invalid ? <FieldError id={`${id}-url-error`}>{t("invalidUrl")}</FieldError> : null}
          </Field>
          <DialogFooter className="sm:justify-between">
            {editing ? (
              <Button type="button" variant="ghost" onClick={onRemove} className="min-h-11 md:min-h-8">
                {t("remove")}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={onCancel} className="min-h-11 md:min-h-8">
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={url.trim() === ""} className="min-h-11 md:min-h-8">
                {t("save")}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
