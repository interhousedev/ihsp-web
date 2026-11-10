"use client"

import { deleteStudentFace, putStudentFace } from "@ihsp/api"
import { FacePhotoEditor } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { useState } from "react"

/**
 * The entrance photo of a student (curator upload, replace, delete). There is no read endpoint for another person's
 * face, so the picture shown is the one saved in this session. A photo set here is locked against the student.
 */
export function StudentFace({ studentId, name }: { studentId: string; name: string }) {
  const t = useT("group.students.face")
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  return (
    <section aria-label={t("title")} className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">{t("title")}</h3>
      <p className="text-muted-foreground text-xs">{t("hint")}</p>
      <FacePhotoEditor
        name={name}
        photoUrl={photoUrl}
        removable
        onUpload={async (file) => {
          const saved = await putStudentFace(studentId, file)
          setPhotoUrl(saved.photo_url)
        }}
        onRemove={async () => {
          await deleteStudentFace(studentId)
          setPhotoUrl(null)
        }}
      />
    </section>
  )
}
