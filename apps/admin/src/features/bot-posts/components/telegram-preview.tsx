"use client"

import { useT } from "@ihsp/i18n"

export type PreviewButton = { label: string; url: string }

/**
 * A Telegram-like message card: the body as Telegram HTML and the inline buttons under it.
 * The HTML comes from `toTelegramHtml`, which escapes all text and writes only the subset Telegram accepts.
 */
export function TelegramPreview({ html, buttons }: { html: string; buttons: PreviewButton[] }) {
  const t = useT("botPosts.preview")
  return (
    <div className="bg-muted rounded-lg p-4">
      <div className="bg-background max-w-md rounded-2xl rounded-tl-sm p-3 shadow-sm">
        {html ? (
          <div className="text-sm break-words whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <p className="text-muted-foreground text-sm">{t("empty")}</p>
        )}
        {buttons.length > 0 ? (
          <div className="mt-3 flex flex-col gap-1">
            {buttons.map((button, index) => (
              <div
                key={index}
                className="bg-primary/10 text-primary rounded-md py-2 text-center text-sm font-medium break-words"
              >
                {button.label || t("buttonEmpty")}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
