// Course certificates (`/v1/certificates/courses`): staff design and rules, partners, issued list, learner status and
// the public verification page.

import type { components } from "../generated/openapi"
import { api } from "../client"
import { queryOptions, seg, type RequestOptions } from "../query"

type S = components["schemas"]

// The response schemas mark fields with server defaults as optional; the server always sends them, hence `Required`.

export type CertLabels = S["Labels"]

/** `min_pct: null`: the tier needs only the passing mark. */
export type CertTier = Required<S["TierBody"]>

export type CertSettings = Omit<Required<S["SettingsBody-Output"]>, "tiers"> & { tiers: CertTier[] }

/** Box position and size (`x`, `y`, `w`, `h`) are fractions (0..1) of the template; `size` of its height. */
export type CertField = Required<S["TemplateField"]>
export type CertFieldKey = CertField["key"]
export type CertFont = CertField["font"]
export type CertAlign = CertField["align"]

export const CERT_FIELD_KEYS = [
  "name",
  "course",
  "tier",
  "date",
  "partner",
  "code",
  "qr",
  "custom_text",
] as const satisfies readonly CertFieldKey[]
export const CERT_FONTS = [
  "montserrat",
  "oswald",
  "lora",
  "eb_garamond",
  "cormorant",
] as const satisfies readonly CertFont[]

export type CertQrStyle = Required<S["QrStyle"]>

export type CertTemplate = Omit<S["TemplateResponse"], "fields" | "qr"> & { fields: CertField[]; qr: CertQrStyle }

export type CertPartner = S["PartnerResponse"]
export type CertPartnerBody = S["PartnerBody"]

export type CertIssued = S["IssuedItem"]

export type MyCourseCertificate = S["MyCertificate"]

export type MyCourseCertificateStatus = Omit<S["MineResponse"], "next_tier"> & { next_tier: CertTier | null }

export type PublicCertPartner = S["PublicPartner"]

export type CertVerification = S["VerifyResponse"]

export type CoursePublicCertificates = S["PublicCourseInfo"]

const P = "/v1/certificates/courses"

export const certKeys = {
  all: (courseId: string) => ["lms", "certificates", courseId] as const,
  settings: (courseId: string) => ["lms", "certificates", courseId, "settings"] as const,
  templates: (courseId: string) => ["lms", "certificates", courseId, "templates"] as const,
  partners: (courseId: string) => ["lms", "certificates", courseId, "partners"] as const,
  issued: (courseId: string) => ["lms", "certificates", courseId, "issued"] as const,
  mine: (courseId: string) => ["lms", "certificates", courseId, "mine"] as const,
  public: (courseId: string) => ["lms", "certificates", courseId, "public"] as const,
  verify: (code: string) => ["lms", "certificates", "verify", code] as const,
}

/** An API-relative address (`/v1/...`) as an absolute one, for `<img src>`; other values are returned as is. */
export function certAssetUrl(path: string): string {
  return path.startsWith("/v1/") ? api.url(path) : path
}

/** GET /v1/certificates/fonts/{font}.woff2 — public. */
export const certFontUrl = (font: CertFont) => certAssetUrl(`/v1/certificates/fonts/${seg(font)}.woff2`)

function upload(file: File): FormData {
  const form = new FormData()
  form.append("file", file)
  return form
}

/** GET /{course_id}/settings — course writers. */
export function getCertSettings(courseId: string, opts?: RequestOptions): Promise<CertSettings> {
  return api.get<CertSettings>(`${P}/${seg(courseId)}/settings`, opts)
}
export const getCertSettingsQuery = (courseId: string) =>
  queryOptions({
    queryKey: certKeys.settings(courseId),
    queryFn: ({ signal }) => getCertSettings(courseId, { signal }),
  })

/** PUT /{course_id}/settings. */
export function putCertSettings(courseId: string, body: CertSettings, opts?: RequestOptions): Promise<CertSettings> {
  return api.put<CertSettings>(`${P}/${seg(courseId)}/settings`, body, opts)
}

/** GET /{course_id}/templates. */
export function getCertTemplates(courseId: string, opts?: RequestOptions): Promise<{ items: CertTemplate[] }> {
  return api.get<{ items: CertTemplate[] }>(`${P}/${seg(courseId)}/templates`, opts)
}
export const getCertTemplatesQuery = (courseId: string) =>
  queryOptions({
    queryKey: certKeys.templates(courseId),
    queryFn: ({ signal }) => getCertTemplates(courseId, { signal }),
  })

/** POST /{course_id}/templates. */
export function postCertTemplate(
  courseId: string,
  body: { name: string },
  opts?: RequestOptions,
): Promise<CertTemplate> {
  return api.post<CertTemplate>(`${P}/${seg(courseId)}/templates`, body, opts)
}

/** PUT /{course_id}/templates/{template_id}. */
export function putCertTemplate(
  courseId: string,
  templateId: string,
  body: Pick<CertTemplate, "name" | "fields" | "qr">,
  opts?: RequestOptions,
): Promise<CertTemplate> {
  return api.put<CertTemplate>(`${P}/${seg(courseId)}/templates/${seg(templateId)}`, body, opts)
}

/** DELETE /{course_id}/templates/{template_id}. */
export function deleteCertTemplate(courseId: string, templateId: string, opts?: RequestOptions): Promise<void> {
  return api.delete<void>(`${P}/${seg(courseId)}/templates/${seg(templateId)}`, opts)
}

/** POST /{course_id}/templates/{template_id}/background — PNG, JPEG or PDF (first page), up to 10 MB. */
export function postCertBackground(
  courseId: string,
  templateId: string,
  file: File,
  opts?: RequestOptions,
): Promise<CertTemplate> {
  return api.request<CertTemplate>({
    ...opts,
    method: "POST",
    path: `${P}/${seg(courseId)}/templates/${seg(templateId)}/background`,
    formData: upload(file),
  })
}

/** GET /{course_id}/templates/{template_id}/preview.png?name= — the server render of the saved template. */
export function getCertPreview(
  courseId: string,
  templateId: string,
  name: string | null,
  opts?: RequestOptions,
): Promise<Blob> {
  return api.get<Blob>(`${P}/${seg(courseId)}/templates/${seg(templateId)}/preview.png`, {
    ...opts,
    query: { name: name || undefined },
    responseType: "blob",
  })
}

/** GET /{course_id}/partners. */
export function getCertPartners(courseId: string, opts?: RequestOptions): Promise<{ items: CertPartner[] }> {
  return api.get<{ items: CertPartner[] }>(`${P}/${seg(courseId)}/partners`, opts)
}
export const getCertPartnersQuery = (courseId: string) =>
  queryOptions({
    queryKey: certKeys.partners(courseId),
    queryFn: ({ signal }) => getCertPartners(courseId, { signal }),
  })

/** POST /{course_id}/partners. */
export function postCertPartner(courseId: string, body: CertPartnerBody, opts?: RequestOptions): Promise<CertPartner> {
  return api.post<CertPartner>(`${P}/${seg(courseId)}/partners`, body, opts)
}

/** PUT /{course_id}/partners/{partner_id}. */
export function putCertPartner(
  courseId: string,
  partnerId: string,
  body: CertPartnerBody,
  opts?: RequestOptions,
): Promise<CertPartner> {
  return api.put<CertPartner>(`${P}/${seg(courseId)}/partners/${seg(partnerId)}`, body, opts)
}

/** DELETE /{course_id}/partners/{partner_id}. */
export function deleteCertPartner(courseId: string, partnerId: string, opts?: RequestOptions): Promise<void> {
  return api.delete<void>(`${P}/${seg(courseId)}/partners/${seg(partnerId)}`, opts)
}

/** POST /{course_id}/partners/{partner_id}/logo (multipart). */
export function postCertPartnerLogo(
  courseId: string,
  partnerId: string,
  file: File,
  opts?: RequestOptions,
): Promise<CertPartner> {
  return api.request<CertPartner>({
    ...opts,
    method: "POST",
    path: `${P}/${seg(courseId)}/partners/${seg(partnerId)}/logo`,
    formData: upload(file),
  })
}

/** GET /{course_id}/issued. */
export function getCertIssued(courseId: string, opts?: RequestOptions): Promise<{ items: CertIssued[] }> {
  return api.get<{ items: CertIssued[] }>(`${P}/${seg(courseId)}/issued`, opts)
}
export const getCertIssuedQuery = (courseId: string) =>
  queryOptions({ queryKey: certKeys.issued(courseId), queryFn: ({ signal }) => getCertIssued(courseId, { signal }) })

/** POST /{course_id}/issue-eligible — issues to every learner who passed and has none yet. */
export function postCertIssueEligible(courseId: string, opts?: RequestOptions): Promise<{ issued: number }> {
  return api.post<{ issued: number }>(`${P}/${seg(courseId)}/issue-eligible`, undefined, opts)
}

/** POST /{course_id}/issued/{id}/revoke. */
export function postCertRevoke(courseId: string, certId: string, reason: string, opts?: RequestOptions): Promise<void> {
  return api.post<void>(`${P}/${seg(courseId)}/issued/${seg(certId)}/revoke`, { reason }, opts)
}

/** POST /{course_id}/mine — the learner's progress to the passing mark; issues the certificate once eligible. */
export function postMyCourseCertificate(courseId: string, opts?: RequestOptions): Promise<MyCourseCertificateStatus> {
  return api.post<MyCourseCertificateStatus>(`${P}/${seg(courseId)}/mine`, undefined, opts)
}
export const myCertificateQuery = (courseId: string) =>
  queryOptions({
    queryKey: certKeys.mine(courseId),
    queryFn: ({ signal }) => postMyCourseCertificate(courseId, { signal }),
  })

/** GET /issued/{id}/pdf — the holder's PDF. */
export function getMyCertificatePdf(certId: string, opts?: RequestOptions): Promise<Blob> {
  return api.get<Blob>(`${P}/issued/${seg(certId)}/pdf`, { ...opts, responseType: "blob" })
}

/** GET /v1/certificates/verify/{code} — public. */
export function getCertVerification(code: string, opts?: RequestOptions): Promise<CertVerification> {
  return api.get<CertVerification>(`/v1/certificates/verify/${seg(code)}`, { ...opts, auth: "none" })
}
export const getCertVerificationQuery = (code: string) =>
  queryOptions({ queryKey: certKeys.verify(code), queryFn: ({ signal }) => getCertVerification(code, { signal }) })

/** GET /{course_id}/public — public; the course landing "Partner" section. */
export function getCoursePublicCertificates(
  courseId: string,
  opts?: RequestOptions,
): Promise<CoursePublicCertificates> {
  return api.get<CoursePublicCertificates>(`${P}/${seg(courseId)}/public`, { ...opts, auth: "none" })
}
export const getCoursePublicCertificatesQuery = (courseId: string) =>
  queryOptions({
    queryKey: certKeys.public(courseId),
    queryFn: ({ signal }) => getCoursePublicCertificates(courseId, { signal }),
  })
