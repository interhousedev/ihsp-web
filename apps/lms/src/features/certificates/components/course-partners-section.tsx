"use client"

import { getCoursePublicCertificatesQuery } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Icons } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { PartnerLogo } from "./partners-tab"

/**
 * The course "Partner" section on the landing and the About page: every partner organisation of the course and, when
 * certificates are on, a note that the certificate carries a QR check.
 */
export function CoursePartnersSection({ courseId }: { courseId: string }) {
  const t = useT("courseCertificates")
  const info = useQuery({ ...getCoursePublicCertificatesQuery(courseId), retry: false })
  const data = info.data
  if (!data || (!data.enabled && data.partners.length === 0)) return null
  return (
    <section aria-labelledby="course-partners" className="flex flex-col gap-3 rounded-card border p-4">
      <h2 id="course-partners" className="text-lg font-semibold">
        {data.partners.length > 0 ? t("landing.partnerTitle") : t("landing.certificateTitle")}
      </h2>
      {data.partners.length > 0 ? (
        <ul className="flex flex-wrap gap-4">
          {data.partners.map((partner) => (
            <li key={partner.name} className="flex items-center gap-3">
              <PartnerLogo partner={partner} />
              {partner.url ? (
                <a href={partner.url} target="_blank" rel="noopener noreferrer" className="font-medium underline">
                  {partner.name}
                </a>
              ) : (
                <span className="font-medium">{partner.name}</span>
              )}
            </li>
          ))}
        </ul>
      ) : null}
      {data.enabled ? (
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <Icons.qrCode aria-hidden className="size-4 shrink-0" />
          {t("landing.qrNote", { passing: data.passing_pct })}
        </p>
      ) : null}
    </section>
  )
}
