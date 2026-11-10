import { useT } from "@ihsp/i18n"
import { AiMark, Badge, Card, CardContent, cn } from "@ihsp/ui"
import {
  IconCards,
  IconChecklist,
  IconFileText,
  IconPlus,
  IconSend,
  IconSitemap,
  IconSparkles,
  IconWorld,
} from "@ihsp/ui"
import { Screen, SideNav } from "./parts"

const SOURCES = ["lesson", "file", "text"] as const
const STUDIO = [
  { key: "quiz", icon: IconChecklist },
  { key: "cards", icon: IconCards },
  { key: "map", icon: IconSitemap },
  { key: "report", icon: IconFileText },
] as const

/** A notebook: sources on the left, a grounded answer with citations in the middle, Studio outputs on the right. */
export function NotebookLaptop() {
  const t = useT("landing.demo")
  return (
    <Screen className="flex-row">
      <SideNav
        active="assistant"
        name={t("appName")}
        items={(["home", "calendar", "marks", "tasks", "library", "assistant"] as const).map((key) => ({
          key,
          label: t(`nav.${key}`),
        }))}
      />
      <div className="grid min-w-0 flex-1 grid-cols-[190px_1fr_190px] gap-3 p-4">
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground flex items-center justify-between text-xs font-medium">
            {t("sources")}
            <IconPlus className="size-4" aria-hidden />
          </p>
          {SOURCES.map((key, index) => (
            <Card key={key} size="sm" className={index === 0 ? "ring-[var(--brand)]" : undefined}>
              <CardContent className="flex flex-col gap-1 px-3">
                <span className="text-[13px] leading-tight font-medium">{t(`source.${key}`)}</span>
                <span className="text-muted-foreground text-[11px]">{t(`sourceKind.${key}`)}</span>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          <p className="text-lg font-semibold">{t("notebookTitle")}</p>
          <div className="bg-muted ml-auto max-w-[85%] rounded-2xl rounded-br-sm px-3.5 py-2 text-[13px]">
            {t("question")}
          </div>
          <div className="flex gap-2">
            <AiMark label={t("ai")} className="mt-1" />
            <div className="min-w-0 flex-1 text-[13px] leading-relaxed">
              <p>
                {t("answer")}
                <sup className="ml-0.5 rounded bg-[var(--brand-soft)] px-1 text-[10px] font-semibold text-[var(--brand-text)]">
                  1
                </sup>
              </p>
              <p className="mt-2 flex flex-wrap items-center gap-1.5">
                <Badge variant="outline">
                  <IconFileText aria-hidden />
                  {t("source.lesson")}
                </Badge>
                <Badge variant="outline">
                  <IconWorld aria-hidden />
                  {t("web")}
                </Badge>
              </p>
            </div>
          </div>
          <div className="text-muted-foreground rounded-card mt-auto flex items-center gap-2 border px-3 py-2 text-[13px]">
            <span className="flex-1">{t("askPlaceholder")}</span>
            <IconSend className="size-4" aria-hidden />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground flex items-center gap-1 text-xs font-medium">
            <IconSparkles className="size-3.5" aria-hidden />
            {t("studio")}
          </p>
          {STUDIO.map(({ key, icon: StudioIcon }) => (
            <Card key={key} size="sm">
              <CardContent className="flex items-center gap-2 px-3">
                <StudioIcon className="size-4 text-[var(--brand-text)]" aria-hidden />
                <span className="text-[13px] font-medium">{t(`studioKind.${key}`)}</span>
              </CardContent>
            </Card>
          ))}
          <Card size="sm" className={cn("bg-[var(--brand-soft)]")}>
            <CardContent className="px-3 text-[12px]">
              <span className="font-medium">{t("quizReady")}</span>
              <span className="text-muted-foreground block">{t("quizMeta")}</span>
            </CardContent>
          </Card>
        </div>
      </div>
    </Screen>
  )
}
