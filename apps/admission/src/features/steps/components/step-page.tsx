"use client"

import type { Role } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Icons, PageHeader, StateView } from "@ihsp/ui"
import { AdmissionShell } from "../../shell/components/admission-shell"

/** A page of the admission flow: title and a real empty state until the screen's data exists. */
export function StepPage({ page, icon, roles }: { page: string; icon: keyof typeof Icons; roles?: Role[] }) {
  const t = useT("pages")
  const Icon = Icons[icon]
  return (
    <AdmissionShell roles={roles}>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 md:p-6">
        <PageHeader title={t(`${page}.title`)} />
        <StateView
          state="empty"
          icon={<Icon className="size-8" />}
          title={t(`${page}.emptyTitle`)}
          description={t(`${page}.emptyText`)}
        />
      </div>
    </AdmissionShell>
  )
}
