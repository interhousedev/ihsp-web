"use client"

import { useT } from "@ihsp/i18n"
import { Markdown, Tabs, TabsContent, TabsList, TabsTrigger, Textarea } from "@ihsp/ui"
import { useId } from "react"

/** A Markdown field with a Write tab and a rendered Preview tab (the same safe renderer students see). */
export function MarkdownEditor({
  value,
  onChange,
  label,
  disabled,
  rows = 8,
}: {
  value: string
  onChange: (value: string) => void
  label: string
  disabled?: boolean
  rows?: number
}) {
  const t = useT("markdownEditor")
  const id = useId()
  return (
    <Tabs defaultValue="write">
      <TabsList>
        <TabsTrigger value="write" className="min-h-11 md:min-h-0">
          {t("write")}
        </TabsTrigger>
        <TabsTrigger value="preview" className="min-h-11 md:min-h-0">
          {t("preview")}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="write">
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <Textarea
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={rows}
          disabled={disabled}
          spellCheck
          className="font-mono"
        />
      </TabsContent>
      <TabsContent value="preview">
        <div className="min-h-24 rounded-lg border p-3" aria-label={t("previewLabel")}>
          {value.trim() === "" ? (
            <p className="text-muted-foreground text-sm italic">{t("empty")}</p>
          ) : (
            <Markdown>{value}</Markdown>
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}
