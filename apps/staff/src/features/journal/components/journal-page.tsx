"use client"

import { getJournalCsv, getStaffJournalOptionsQuery, getStaffJournalQuery } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons, PageContainer, StateView } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { parseAsString, useQueryState } from "nuqs"
import { useState } from "react"
import { toast } from "sonner"
import { QueryState } from "../../shared/components/query-state"
import { downloadBlob } from "../../shared/utils/download-blob"
import { selectedOption } from "../utils/selection"
import { JournalGrid } from "./journal-grid"
import { JournalPicker } from "./journal-picker"

/**
 * Journal (STF-9, UF-STF-07): a subject and an audience the teacher teaches, then a grid of students by lessons with
 * absences and EMIS marks. Absences can be toggled inside the 7-day window; the grid exports to CSV.
 * `?subject=&audience=` keep the choice in the address.
 */
export function JournalPage() {
  const t = useT("journal")
  const errorMessage = useErrorMessage()
  const [subject, setSubject] = useQueryState("subject", parseAsString)
  const [audience, setAudience] = useQueryState("audience", parseAsString)
  const [exporting, setExporting] = useState(false)
  const optionsQuery = useQuery(getStaffJournalOptionsQuery())
  const selected = selectedOption(optionsQuery.data ?? [], subject, audience)
  const params = selected ? { subject_id: selected.subject.id, audience_key: selected.audience_key } : null
  const journalQuery = useQuery({
    ...getStaffJournalQuery(params ?? { subject_id: "", audience_key: "" }),
    enabled: params !== null,
  })

  async function exportCsv() {
    if (!params) return
    setExporting(true)
    try {
      const blob = await getJournalCsv(params)
      downloadBlob(blob, `journal-${params.audience_key.replace(/[^\w-]+/g, "_")}.csv`)
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setExporting(false)
    }
  }

  return (
    <PageContainer
      title={t("title")}
      description={t("description")}
      actions={
        <Button
          variant="outline"
          className="min-h-11 md:min-h-8"
          disabled={!params || exporting}
          onClick={() => void exportCsv()}
        >
          <Icons.upload aria-hidden />
          {t("export")}
        </Button>
      }
    >
      <QueryState query={optionsQuery} rows={2} isEmpty={(options) => options.length === 0} emptyText={t("noOptions")}>
        {(options) => (
          <>
            <JournalPicker
              options={options}
              selected={selected}
              onChange={(nextSubject, nextAudience) => {
                void setSubject(nextSubject)
                void setAudience(nextAudience)
              }}
            />
            {params ? (
              <QueryState query={journalQuery} rows={5}>
                {(journal) =>
                  journal.lessons.length === 0 || journal.students.length === 0 ? (
                    <StateView state="empty" emptyText={t("noLessons")} />
                  ) : (
                    <>
                      <JournalGrid journal={journal} params={params} />
                      <p className="text-muted-foreground text-xs">{t("hint")}</p>
                    </>
                  )
                }
              </QueryState>
            ) : null}
          </>
        )}
      </QueryState>
    </PageContainer>
  )
}
