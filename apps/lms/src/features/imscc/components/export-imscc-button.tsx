"use client"

import { getLmsCourseExportImscc } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, LoadingButton } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"

/** Downloads the course as an IMS Common Cartridge (.imscc); for course editors. */
export function ExportImsccButton({ courseId, slug }: { courseId: string; slug?: string }) {
  const t = useT("imscc")
  const errorMessage = useErrorMessage()
  const exportCourse = useMutation<Blob, unknown, void>({
    mutationFn: () => getLmsCourseExportImscc(courseId),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${slug || courseId}.imscc`
      document.body.append(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
    },
  })
  return (
    <div className="flex flex-col gap-2">
      <LoadingButton
        type="button"
        variant="outline"
        className="min-h-11 self-start md:min-h-8"
        loading={exportCourse.isPending}
        onClick={() => exportCourse.mutate()}
      >
        {t("export")}
      </LoadingButton>
      {exportCourse.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(exportCourse.error)}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
