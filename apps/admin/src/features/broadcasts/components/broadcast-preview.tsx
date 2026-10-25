"use client"

import { useT } from "@ihsp/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@ihsp/ui"
import { renderTelegramHtml } from "../utils/telegram-html"

/** How the text will look in Telegram (safe subset of HTML; nothing else is rendered). */
export function BroadcastPreview({ title, text }: { title: string; text: string }) {
  const t = useT("broadcasts.editor")
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{t("previewTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          data-testid="broadcast-preview"
          className="bg-muted/50 rounded-lg p-3 text-sm break-words whitespace-pre-wrap"
        >
          {title.trim() ? <p className="mb-2 font-semibold">{title}</p> : null}
          {text.trim() ? renderTelegramHtml(text) : <span className="text-muted-foreground">{t("previewEmpty")}</span>}
        </div>
      </CardContent>
    </Card>
  )
}
