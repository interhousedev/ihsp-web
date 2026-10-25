"use client"

import { useT } from "@ihsp/i18n"
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Label, Textarea } from "@ihsp/ui"
import { useId, useMemo, useRef, useState } from "react"
import { detectSeparator, parseImport, type ImportSeparator, type ImportedCard } from "../utils/parse-import"

const SEPARATORS: readonly ImportSeparator[] = ["tab", "comma", "semicolon"]

export type ImportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The cards found in the text; the editor adds them after the existing ones. */
  onImport: (cards: ImportedCard[]) => void
}

/** Paste cards, one per line with the term and the definition separated by a tab (or choose another separator). */
export function ImportDialog({ open, onOpenChange, onImport }: ImportDialogProps) {
  const t = useT("flashcards.import")
  const textId = useId()
  const [text, setText] = useState("")
  const [separator, setSeparator] = useState<ImportSeparator>("tab")
  const fileInput = useRef<HTMLInputElement>(null)
  const parsed = useMemo(() => parseImport(text, separator), [text, separator])

  async function readFile(file: File) {
    const content = await file.text()
    setText(content)
    setSeparator(detectSeparator(content))
  }

  function confirm() {
    if (parsed.cards.length === 0) return
    onImport(parsed.cards)
    setText("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Label htmlFor={textId} className="sr-only">
            {t("textLabel")}
          </Label>
          <Textarea
            id={textId}
            value={text}
            rows={8}
            className="font-mono text-sm"
            placeholder={t("placeholder")}
            onChange={(event) => setText(event.target.value)}
          />
          <fieldset className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <legend className="text-muted-foreground mb-1 text-xs font-medium">{t("separator")}</legend>
            {SEPARATORS.map((name) => (
              <label key={name} className="flex min-h-9 items-center gap-1.5 text-sm">
                <input
                  type="radio"
                  name={`${textId}-separator`}
                  className="size-4"
                  checked={separator === name}
                  onChange={() => setSeparator(name)}
                />
                {t(`separators.${name}`)}
              </label>
            ))}
          </fieldset>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 md:min-h-8"
              onClick={() => fileInput.current?.click()}
            >
              {t("chooseFile")}
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept=".txt,.csv,.tsv,text/plain,text/csv,text/tab-separated-values"
              className="hidden"
              data-testid="import-file-input"
              aria-label={t("chooseFile")}
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ""
                if (file) void readFile(file)
              }}
            />
            <p className="text-muted-foreground text-sm" role="status">
              {t("found", { count: parsed.cards.length })}
              {parsed.skipped > 0 ? ` ${t("skipped", { count: parsed.skipped })}` : ""}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" className="min-h-11" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button type="button" className="min-h-11" disabled={parsed.cards.length === 0} onClick={confirm}>
            {t("confirm", { count: parsed.cards.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
