"use client"

import { useT } from "@ihsp/i18n"
import { Icons } from "@ihsp/ui"
import Link from "next/link"
import { LogoAvatar } from "../../../components/lib/photo-header"
import { AsideCard } from "../../../components/lib/split-layout"
import { useList } from "../../chooser/hooks"
import type { Essay } from "../api"
import { SuppPrompts } from "./supp-prompts"

/** What the student knows about a supplemental essay: the college, its prompt, the limit and the college's prompts. */
export function SuppInfo({ essay }: { essay: Essay }) {
  const t = useT("essays")
  const entry = useList().data?.find((e) => e.id === essay.list_entry_id)
  const name = entry?.institution.name
  return (
    <AsideCard title={t("supp.panel")} icon={<Icons.post aria-hidden className="size-4" />}>
      <dl className="flex flex-col gap-2 text-sm">
        <div>
          <dt className="text-muted-foreground text-xs">{t("college")}</dt>
          <dd>
            {name ? (
              <Link
                href={`/chooser/list/?entry=${encodeURIComponent(essay.list_entry_id ?? "")}`}
                className="flex items-center gap-2"
              >
                <LogoAvatar
                  name={name}
                  src={entry?.institution.logo_url}
                  fit={entry?.institution.logo_fit}
                  zoom={entry?.institution.logo_zoom}
                  className="size-6"
                />
                {name}
              </Link>
            ) : (
              <span className="text-muted-foreground">{t("supp.noCollege")}</span>
            )}
          </dd>
        </div>
      </dl>
      {entry && name ? (
        <div className="mt-4 border-t pt-4">
          <SuppPrompts
            institutionId={entry.institution.id}
            listEntryId={entry.id}
            college={name}
            websiteUrl={entry.institution.website_url}
          />
        </div>
      ) : null}
    </AsideCard>
  )
}
