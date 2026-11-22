"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, Skeleton, StateView } from "@ihsp/ui"
import { QueryError } from "../../shell/components/query-error"
import { useProjectHelpers, type Helper } from "../api"

type Lang = "en" | "ru" | "uz"
const toLang = (locale: string): Lang => (locale === "ru" || locale === "uz" ? locale : "en")

/** Contact links for a helper; the schemes decide how the device opens them. */
export function contactLinks(c: Helper["contacts"]): { key: string; href: string; label: string }[] {
  const out: { key: string; href: string; label: string }[] = []
  if (c.email) out.push({ key: "email", href: `mailto:${c.email}`, label: c.email })
  if (c.phone) out.push({ key: "phone", href: `tel:${c.phone.replace(/[^+\d]/g, "")}`, label: c.phone })
  if (c.telegram) {
    const href = c.telegram.startsWith("@") ? `https://t.me/${c.telegram.slice(1)}` : c.telegram
    out.push({ key: "telegram", href, label: c.telegram })
  }
  if (c.website) out.push({ key: "website", href: c.website, label: c.website.replace(/^https?:\/\//, "") })
  return out
}

function HelperCard({ helper }: { helper: Helper }) {
  const t = useT("projects")
  const lang = toLang(useLocale())
  const links = contactLinks(helper.contacts)
  return (
    <li className="bg-card flex flex-col gap-2 rounded-card border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="bg-muted rounded-full px-2 py-0.5 text-xs">{t(`helpers.kind.${helper.kind}`)}</span>
        <span className="font-medium">{helper.name}</span>
        {helper.city && <span className="text-muted-foreground text-xs">{helper.city}</span>}
      </div>
      <p className="text-sm">{helper.description[lang] || helper.description.en}</p>
      {helper.help_types.length > 0 && (
        <ul className="flex flex-wrap gap-1" aria-label={t("helpers.helpTypes")}>
          {helper.help_types.map((h) => (
            <li key={h} className="border-primary/40 rounded-full border px-2 py-0.5 text-xs">
              {t(`helpTypes.${h}`)}
            </li>
          ))}
        </ul>
      )}
      {helper.expertise_areas.length > 0 && (
        <p className="text-muted-foreground text-xs">
          {t("helpers.expertise")}: {helper.expertise_areas.join(", ")}
        </p>
      )}
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {links.map((l) => (
          <li key={l.key}>
            <a
              className="text-primary inline-flex min-h-11 items-center text-sm break-all underline"
              href={l.href}
              {...(l.key === "email" || l.key === "phone" ? {} : { target: "_blank", rel: "noreferrer" })}
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </li>
  )
}

/** The people and organizations that can help with one project's needs (its help tags). */
export function HelpersDrawer({
  open,
  onOpenChange,
  title,
  tags,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  tags: string[]
}) {
  const t = useT("projects")
  const query = useProjectHelpers(tags, open)
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{t("helpers.title")}</SheetTitle>
          <SheetDescription>{title}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-3 p-4">
          {query.isPending ? (
            <Skeleton className="h-24 w-full" />
          ) : query.isError ? (
            <QueryError error={query.error} onRetry={() => void query.refetch()} />
          ) : query.data.items.length === 0 ? (
            <StateView state="empty" title={t("helpers.emptyTitle")} description={t("helpers.emptyText")} />
          ) : (
            <ul className="flex flex-col gap-3">
              {query.data.items.map((h) => (
                <HelperCard key={h.id} helper={h} />
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
