"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { toast } from "sonner"
import { downloadDocument, useUploadVersion, type AdmissionDocument } from "../api"
import { DocumentStatus } from "./document-status"
import { FilePickButton } from "./file-pick-button"

/** One of my documents: state chip, the rejection reason with "upload a new version", and the signed download. */
export function DocumentRow({ doc }: { doc: AdmissionDocument }) {
  const t = useT("documents")
  const errorMessage = useErrorMessage()
  const upload = useUploadVersion()
  const rejected = doc.review_status === "rejected"

  async function open() {
    try {
      const link = await downloadDocument(doc.id)
      window.open(link.url, "_blank", "noopener")
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <li className="bg-card flex flex-col gap-2 rounded-card border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <span className="font-medium">{t(`kind.${doc.kind}`)}</span>
          <span className="text-muted-foreground text-xs">
            {t("attachedTo", { count: doc.attachments.length })} ·{" "}
            {t("versionNumber", { version: doc.current_version })}
          </span>
        </div>
        <DocumentStatus doc={doc} />
      </div>
      {rejected && (
        <p role="alert" className="text-destructive text-sm">
          {doc.reject_reason_code ? t(`reason.${doc.reject_reason_code}`) : t("rejectedNoReason")}
          {doc.reject_note ? `: ${doc.reject_note}` : ""}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {doc.can_download ? (
          <Button type="button" variant="outline" size="sm" onClick={() => void open()}>
            <Icons.externalLink data-icon="inline-start" aria-hidden />
            {t("download")}
          </Button>
        ) : (
          <span className="text-muted-foreground text-xs">{t("confidential")}</span>
        )}
        {(rejected || doc.review_status === "none") && (
          <FilePickButton
            size="sm"
            label={t(rejected ? "uploadNewVersion" : "replaceFile")}
            disabled={upload.isPending}
            onPick={(file) =>
              upload.mutate({ id: doc.id, file }, { onError: (error) => toast.error(errorMessage(error)) })
            }
          />
        )}
      </div>
    </li>
  )
}
