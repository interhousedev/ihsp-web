"use client"

import { certKeys, getCertIssuedQuery, postCertIssueEligible, postCertRevoke, type CertIssued } from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import {
  Badge,
  ConfirmDialog,
  Label,
  LoadingButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useId, useState } from "react"
import { toast } from "sonner"
import { hrefs } from "../../shared/utils/hrefs"

const REASON_MAX = 500

/** Issued: every certificate of the course, revoking with a reason and issuing to all who already qualify. */
export function IssuedTab({ courseId }: { courseId: string }) {
  const t = useT("courseCertificates")
  const format = useFormatters()
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const issued = useQuery(getCertIssuedQuery(courseId))
  const [revoking, setRevoking] = useState<CertIssued | null>(null)
  const [reason, setReason] = useState("")
  const reasonId = useId()

  const issueAll = useMutation({
    mutationFn: () => postCertIssueEligible(courseId),
    onSuccess: ({ issued: count }) => {
      void queryClient.invalidateQueries({ queryKey: certKeys.issued(courseId) })
      toast.success(t("issued.issuedAll", { count }))
    },
    onError: (error) => toast.error(errorMessage(error)),
  })
  const revoke = useMutation({
    mutationFn: (cert: CertIssued) => postCertRevoke(courseId, cert.id, reason.trim()),
    onSuccess: () => {
      setRevoking(null)
      setReason("")
      void queryClient.invalidateQueries({ queryKey: certKeys.issued(courseId) })
      toast.success(t("issued.revoked"))
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">{t("issued.hint")}</p>
        <LoadingButton
          type="button"
          loading={issueAll.isPending}
          onClick={() => issueAll.mutate()}
          className="min-h-11 md:min-h-8"
        >
          {t("issued.issueAll")}
        </LoadingButton>
      </div>
      <QueryState query={issued} rows={4}>
        {({ items }) =>
          items.length === 0 ? (
            <p className="text-muted-foreground rounded-card border border-dashed p-4 text-sm">{t("issued.empty")}</p>
          ) : (
            <div className="overflow-x-auto rounded-card border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("issued.student")}</TableHead>
                    <TableHead>{t("issued.tier")}</TableHead>
                    <TableHead>{t("issued.date")}</TableHead>
                    <TableHead>{t("issued.code")}</TableHead>
                    <TableHead>{t("issued.status")}</TableHead>
                    <TableHead>
                      <span className="sr-only">{t("issued.actions")}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell className="font-medium">{cert.student.name}</TableCell>
                      <TableCell>{cert.tier}</TableCell>
                      <TableCell className="tabular-nums">{format.date(cert.issued_at)}</TableCell>
                      <TableCell>
                        <a href={hrefs.verify(cert.code)} className="font-mono text-xs underline">
                          {cert.code}
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge variant={cert.revoked ? "destructive" : "outline"}>
                          {cert.revoked ? t("issued.statusRevoked") : t("issued.statusValid")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-end">
                        {cert.revoked ? null : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive min-h-11 md:min-h-8"
                            onClick={() => setRevoking(cert)}
                          >
                            {t("issued.revoke")}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        }
      </QueryState>
      <ConfirmDialog
        open={revoking !== null}
        onOpenChange={(open) => (open ? null : setRevoking(null))}
        title={t("issued.revokeTitle", { name: revoking?.student.name ?? "" })}
        description={t("issued.revokeHint")}
        confirmLabel={t("issued.revoke")}
        destructive
        loading={revoke.isPending}
        confirmDisabled={reason.trim() === ""}
        onConfirm={() => (revoking ? revoke.mutate(revoking) : undefined)}
      >
        <div className="flex flex-col gap-1">
          <Label htmlFor={reasonId}>{t("issued.reason")}</Label>
          <Textarea id={reasonId} value={reason} maxLength={REASON_MAX} onChange={(e) => setReason(e.target.value)} />
        </div>
      </ConfirmDialog>
    </div>
  )
}
