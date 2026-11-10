"use client"

import { deleteStudentFace, putStudentFace, type StudentItem } from "@ihsp/api"
import { FacePhotoEditor } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { ResponsiveDialog } from "@ihsp/ui"
import { useState } from "react"
import { fullName } from "../../shared/utils/names"

/**
 * The entrance photo of a student, set by an administrator. There is no read endpoint for another person's face, so the
 * picture shown is the one saved while the dialog is open. A photo set here is locked against the student.
 */
export function StudentFaceDialog({ student, onClose }: { student: StudentItem | null; onClose: () => void }) {
  const t = useT("studentFace")
  return (
    <ResponsiveDialog
      open={student !== null}
      onOpenChange={(open) => !open && onClose()}
      title={student ? t("title", { name: fullName(student) }) : ""}
      description={student ? t("hint") : undefined}
    >
      {student ? <FaceBody key={student.user_id} student={student} /> : null}
    </ResponsiveDialog>
  )
}

function FaceBody({ student }: { student: StudentItem }) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  return (
    <FacePhotoEditor
      name={fullName(student)}
      photoUrl={photoUrl}
      removable
      onUpload={async (file) => {
        const saved = await putStudentFace(student.user_id, file)
        setPhotoUrl(saved.photo_url)
      }}
      onRemove={async () => {
        await deleteStudentFace(student.user_id)
        setPhotoUrl(null)
      }}
    />
  )
}
