"use client"

import { BOT_POST_LIMITS, type BotPostButton } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Input, Label } from "@ihsp/ui"
import { LOCALE_CODES, localized } from "../utils/locales"

/** Inline buttons of a post: a label per locale and an https address. */
export function ButtonsEditor({
  value,
  onChange,
  idPrefix,
  disabled,
}: {
  value: BotPostButton[]
  onChange: (buttons: BotPostButton[]) => void
  idPrefix: string
  disabled?: boolean
}) {
  const t = useT("botPosts.buttons")

  function update(index: number, next: BotPostButton) {
    onChange(value.map((button, position) => (position === index ? next : button)))
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium">{t("title")}</p>
      {value.map((button, index) => (
        <div key={index} className="border-input flex flex-col gap-2 rounded-md border p-3">
          <div className="grid gap-2 sm:grid-cols-3">
            {LOCALE_CODES.map((locale) => (
              <div key={locale} className="flex flex-col gap-1">
                <Label htmlFor={`${idPrefix}-${index}-${locale}`}>{t("label", { locale: locale.toUpperCase() })}</Label>
                <Input
                  id={`${idPrefix}-${index}-${locale}`}
                  value={localized(button.label, locale)}
                  maxLength={BOT_POST_LIMITS.label}
                  disabled={disabled}
                  onChange={(event) =>
                    update(index, { ...button, label: { ...button.label, [locale]: event.target.value } })
                  }
                />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor={`${idPrefix}-${index}-url`}>{t("url")}</Label>
            <Input
              id={`${idPrefix}-${index}-url`}
              type="url"
              inputMode="url"
              placeholder="https://"
              value={button.url}
              disabled={disabled}
              onChange={(event) => update(index, { ...button, url: event.target.value })}
            />
          </div>
          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => onChange(value.filter((_, position) => position !== index))}
            >
              {t("remove")}
            </Button>
          </div>
        </div>
      ))}
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || value.length >= BOT_POST_LIMITS.buttons}
          onClick={() => onChange([...value, { label: { uz: "", ru: "", en: "" }, url: "https://" }])}
        >
          {t("add")}
        </Button>
      </div>
    </div>
  )
}
