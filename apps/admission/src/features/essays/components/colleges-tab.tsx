"use client"

import { useT } from "@ihsp/i18n"
import { buttonVariants, StateView, Icons } from "@ihsp/ui"
import Link from "next/link"
import { LogoAvatar } from "../../../components/lib/photo-header"
import { useList } from "../../chooser/hooks"
import { SuppPrompts } from "./supp-prompts"

/** Each university on the list with its own supplemental prompts; `entryId` narrows it to one. */
export function CollegesTab({ entryId }: { entryId: string | null }) {
  const t = useT("essays")
  const list = useList()
  if (list.isPending) return <StateView state="loading" rows={3} />
  if (list.isError) return <StateView state="error" error={list.error} onRetry={() => void list.refetch()} />
  const entries = list.data.filter((e) => !entryId || e.id === entryId)
  if (entries.length === 0) {
    return (
      <StateView
        state="empty"
        icon={<Icons.post aria-hidden />}
        title={t("colleges.emptyTitle")}
        description={t("colleges.emptyText")}
        action={
          <Link href="/chooser/?step=match" className={buttonVariants()}>
            {t("collegeOpen")}
          </Link>
        }
      />
    )
  }
  return (
    <ul className="flex flex-col gap-4">
      {entries.map((e) => (
        <li key={e.id} className="border-hairline flex flex-col gap-3 rounded-card border p-4">
          <div className="flex items-center gap-3">
            <LogoAvatar
              name={e.institution.name}
              src={e.institution.logo_url}
              fit={e.institution.logo_fit}
              zoom={e.institution.logo_zoom}
              className="size-9"
            />
            <h3 className="font-medium">{e.institution.name}</h3>
          </div>
          <SuppPrompts
            institutionId={e.institution.id}
            listEntryId={e.id}
            college={e.institution.name}
            websiteUrl={e.institution.website_url}
          />
        </li>
      ))}
    </ul>
  )
}
