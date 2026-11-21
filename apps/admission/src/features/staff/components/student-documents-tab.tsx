"use client"

import { useT } from "@ihsp/i18n"
import { Icons, Skeleton, StateView } from "@ihsp/ui"
import { useStaffDocuments } from "../../documents/api"
import { QueueRow } from "../../documents/components/staff-documents-page"
import { QueryError } from "../../shell/components/query-error"

/** The student's documents with accept, reject and download, from the staff queue filtered to this student. */
export function StudentDocumentsTab({ studentId }: { studentId: string }) {
  const t = useT("staff")
  const query = useStaffDocuments(null)
  if (query.isPending) return <Skeleton className="h-32 w-full" />
  if (query.isError) return <QueryError error={query.error} onRetry={() => void query.refetch()} section="documents" />
  const docs = query.data.filter((doc) => doc.student_id === studentId)
  if (docs.length === 0)
    return <StateView state="empty" icon={<Icons.files aria-hidden />} title={t("documentsTab.empty")} />
  return (
    <ul className="flex flex-col gap-2">
      {docs.map((doc) => (
        <QueueRow key={doc.id} doc={doc} />
      ))}
    </ul>
  )
}
