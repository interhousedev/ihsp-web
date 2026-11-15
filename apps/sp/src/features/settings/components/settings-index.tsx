"use client"

import { useT } from "@ihsp/i18n"
import { Icons, PageContainer } from "@ihsp/ui"
import Link from "next/link"
import { SETTINGS_GROUPS, settingsGroupHref } from "./settings-groups"

/** The first screen of Settings: one row per topic. */
export function SettingsIndex() {
  const t = useT("settings")
  return (
    <PageContainer title={t("title")}>
      <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {SETTINGS_GROUPS.map((group) => {
          const Icon = Icons[group.icon]
          return (
            <li key={group.id}>
              <Link
                href={settingsGroupHref(group.id)}
                className="hover:bg-muted flex min-h-14 items-center gap-3 rounded-card border p-4"
              >
                <Icon aria-hidden className="text-muted-foreground size-5 shrink-0" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-medium">{t(`groups.${group.id}.title`)}</span>
                  <span className="text-muted-foreground text-sm">{t(`groups.${group.id}.description`)}</span>
                </span>
                <Icons.chevronRight aria-hidden className="text-muted-foreground size-4 shrink-0 rtl:rotate-180" />
              </Link>
            </li>
          )
        })}
      </ul>
    </PageContainer>
  )
}
