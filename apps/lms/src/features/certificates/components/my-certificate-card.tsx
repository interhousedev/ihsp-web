"use client"

import { getMyCertificatePdf, myCertificateQuery } from "@ihsp/api"
import { useErrorMessage, useFormatters, useLocale, useT } from "@ihsp/i18n"
import { Card, CardContent, Icons, LoadingButton, Progress } from "@ihsp/ui"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { LinkButton } from "../../shared/components/link-button"
import { hrefs } from "../../shared/utils/hrefs"
import { pickLabel } from "../hooks/use-cert-fonts"
import { remainingToTier } from "../utils/layout"

/**
 * The learner's certificate for one course: progress to the passing mark, then the certificate itself with its PDF,
 * verification link and the points still missing to the next tier. Renders nothing when the course has no certificate.
 */
export function MyCertificateCard({ courseId, courseTitle }: { courseId: string; courseTitle?: string }) {
  const t = useT("courseCertificates")
  const locale = useLocale()
  const format = useFormatters()
  const errorMessage = useErrorMessage()
  const status = useQuery({ ...myCertificateQuery(courseId), retry: false })

  const pdf = useMutation({
    mutationFn: (certId: string) => getMyCertificatePdf(certId),
    onSuccess: (blob, certId) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `certificate-${certId}.pdf`
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const data = status.data
  if (!data) return null
  const cert = data.certificate
  // Certificates switched off for the course: only an already issued certificate stays visible.
  if (!data.enabled && !cert) return null
  const next = data.next_tier
  const remaining = remainingToTier(data.score_pct, next, data.passing_pct)

  return (
    <Card data-testid="my-certificate">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <Icons.certificates aria-hidden className="text-primary mt-0.5 size-6 shrink-0" />
          <div className="flex min-w-0 flex-col">
            <h3 className="font-semibold">{t("mine.title")}</h3>
            {courseTitle ? <p className="text-muted-foreground truncate text-sm">{courseTitle}</p> : null}
          </div>
        </div>
        {cert ? (
          <>
            <p className="text-sm">
              {cert.revoked
                ? t("mine.revoked")
                : t("mine.issued", { tier: pickLabel(cert.tier, locale), date: format.date(cert.issued_at) })}
            </p>
            {cert.revoked ? null : (
              <div className="flex flex-wrap gap-2">
                <LoadingButton
                  type="button"
                  loading={pdf.isPending}
                  onClick={() => pdf.mutate(cert.id)}
                  className="min-h-11 md:min-h-8"
                >
                  <Icons.fileTypePdf aria-hidden />
                  {t("mine.download")}
                </LoadingButton>
                <LinkButton href={hrefs.verify(cert.code)} variant="outline" className="min-h-11 md:min-h-8">
                  <Icons.badgeCheck aria-hidden />
                  {t("mine.verify")}
                </LinkButton>
              </div>
            )}
            {next && !cert.revoked ? (
              <p className="text-muted-foreground text-sm">
                {t("mine.nextTier", { tier: pickLabel(next.label, locale), points: remaining })}
              </p>
            ) : null}
          </>
        ) : (
          <>
            <Progress value={Math.min(100, (data.score_pct / Math.max(1, data.passing_pct)) * 100)} />
            <p className="text-muted-foreground text-sm tabular-nums">
              {t("mine.progress", {
                score: data.score_pct,
                passing: data.passing_pct,
                steps: data.required_steps_left,
              })}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
