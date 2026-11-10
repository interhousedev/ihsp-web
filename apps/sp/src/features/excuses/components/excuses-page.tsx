"use client"

import { getMeExcusesQuery } from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Button, PageContainer, ResponsiveDialog } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ExcuseCard } from "./excuse-card"
import { ExcuseRequestForm } from "./excuse-request-form"

/** The student's excuse requests with their statuses and the button that opens the request form. */
export function ExcusesPage() {
  const t = useT("excuses")
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const query = useQuery(getMeExcusesQuery())
  return (
    <PageContainer
      title={t("page.title")}
      actions={
        <Button type="button" className="min-h-11 md:min-h-8" onClick={() => setOpen(true)}>
          {t("page.new")}
        </Button>
      }
    >
      <QueryState query={query} isEmpty={(data) => data.items.length === 0} emptyText={t("page.empty")}>
        {(data) => (
          <ul className="flex flex-col gap-3">
            {data.items.map((excuse) => (
              <li key={excuse.id}>
                <ExcuseCard excuse={excuse} />
              </li>
            ))}
          </ul>
        )}
      </QueryState>
      <ResponsiveDialog open={open} onOpenChange={setOpen} title={t("form.title")} size="sm">
        <ExcuseRequestForm
          onCancel={() => setOpen(false)}
          onDone={(id) => {
            setOpen(false)
            router.push(`/excuses/view/?id=${encodeURIComponent(id)}`)
          }}
        />
      </ResponsiveDialog>
    </PageContainer>
  )
}
