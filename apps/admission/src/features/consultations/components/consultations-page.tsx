"use client"

import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { useState } from "react"
import { ScrollFade } from "../../../components/scroll-fade"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { useMyConsultations } from "../api"
import { ConsultationList } from "./consultation-list"
import { RequestConsultationDialog } from "./request-dialog"

export function ConsultationsPage() {
  const t = useT("consultations")
  const query = useMyConsultations()
  const [open, setOpen] = useState(false)
  return (
    <AdmissionShell>
      <div className={pageClass()}>
        <AppPageHeader
          icon="chat"
          title={t("title")}
          actions={
            <Button type="button" onClick={() => setOpen(true)}>
              <Icons.add data-icon="inline-start" aria-hidden />
              {t("request.open")}
            </Button>
          }
        />
        <ScrollFade maxHeight="calc(100svh - 9rem)">
          <ConsultationList
            items={query.data?.items}
            isPending={query.isPending}
            error={query.error}
            onRetry={() => void query.refetch()}
            emptyKey="empty"
          />
        </ScrollFade>
        <RequestConsultationDialog open={open} onOpenChange={setOpen} />
      </div>
    </AdmissionShell>
  )
}
