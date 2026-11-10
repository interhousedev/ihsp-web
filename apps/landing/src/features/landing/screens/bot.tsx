import { useT } from "@ihsp/i18n"
import { IconArrowLeft, IconBrandTelegram, IconPaperclip, IconSend } from "@ihsp/ui"
import { cn } from "@ihsp/ui"
import { Screen } from "./parts"

/** The Telegram bot chat on a phone: a new mark, tomorrow's lessons and a question to the assistant. */
export function BotPhone() {
  const t = useT("landing.demo")
  const bubble = "max-w-[86%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-snug"
  return (
    <Screen className="bg-muted/40">
      <div className="bg-card flex items-center gap-3 border-b px-4 pt-12 pb-3">
        <IconArrowLeft className="size-5" aria-hidden />
        <span
          aria-hidden
          className="flex size-9 items-center justify-center rounded-full bg-[var(--brand)] text-[var(--brand-ink)]"
        >
          <IconBrandTelegram className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">{t("botName")}</span>
          <span className="text-muted-foreground block text-xs">{t("bot")}</span>
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-end gap-2 px-3 pb-3">
        <div className={cn(bubble, "bg-card self-start rounded-bl-sm border")}>
          <span className="block font-semibold">{t("botMarkTitle")}</span>
          {t("botMark")}
        </div>
        <div className={cn(bubble, "bg-card self-start rounded-bl-sm border")}>
          <span className="block font-semibold">{t("botTomorrow")}</span>
          <span className="text-muted-foreground block tabular-nums">
            08:30 · {t("subjects.math")}
            <br />
            10:10 · {t("subjects.physics")}
            <br />
            12:10 · {t("subjects.english")}
          </span>
        </div>
        <div className={cn(bubble, "self-end rounded-br-sm bg-[var(--brand)] text-[var(--brand-ink)]")}>
          {t("botAsk")}
        </div>
        <div className={cn(bubble, "bg-card self-start rounded-bl-sm border")}>{t("botAnswer")}</div>
        <div className="flex gap-2 pt-1">
          <span className="bg-card flex-1 rounded-lg border py-2 text-center text-sm">{t("nav.calendar")}</span>
          <span className="bg-card flex-1 rounded-lg border py-2 text-center text-sm">{t("nav.marks")}</span>
          <span className="bg-card flex-1 rounded-lg border py-2 text-center text-sm">{t("nav.assistant")}</span>
        </div>
      </div>
      <div className="bg-card text-muted-foreground flex items-center gap-3 border-t px-4 pt-3 pb-8 text-sm">
        <IconPaperclip className="size-5" aria-hidden />
        <span className="flex-1">{t("botPlaceholder")}</span>
        <IconSend className="size-5" aria-hidden />
      </div>
    </Screen>
  )
}
