import type {
  CertIssued,
  CertPartner,
  CertPartnerBody,
  CertSettings,
  CertTemplate,
  CertVerification,
  CoursePublicCertificates,
  MyCourseCertificateStatus,
} from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { apiUrl, nextId, noContent, notFound, param, readJson } from "./utils"

const labels = (en: string, ru: string, uz: string) => ({ en, ru, uz })

export const certSettingsFixture: CertSettings = {
  enabled: true,
  passing_pct: 60,
  template_id: "0190a000-0000-4000-8000-0000000000e1",
  partner_ids: [],
  optional_section_ids: [],
  tiers: [
    { key: "pass", label: labels("Pass", "Зачёт", "Oʼtdi"), min_pct: null, color: "#64748b", require_optional: false },
    {
      key: "merit",
      label: labels("Merit", "С отличием", "Aʼlo"),
      min_pct: 85,
      color: "#f59e0b",
      require_optional: false,
    },
  ],
}

const templateFixture: CertTemplate = {
  id: "0190a000-0000-4000-8000-0000000000e1",
  name: "Classic",
  width_px: 1600,
  height_px: 1131,
  background_url: null,
  qr: { style: "square", fg: "#000000", bg: "#ffffff", logo: false },
  fields: [
    {
      key: "name",
      x: 0.2,
      y: 0.4,
      w: 0.6,
      h: 0.1,
      size: 0.06,
      font: "montserrat",
      align: "center",
      color: "#111111",
      weight: 600,
      text: null,
    },
  ],
}

const partnerFixture: CertPartner = {
  id: "0190a000-0000-4000-8000-0000000000e2",
  name: "Partner Lab",
  url: "https://example.org",
  logo_url: null,
  co_issued: false,
}

const issuedFixture: CertIssued = {
  id: "0190a000-0000-4000-8000-0000000000e3",
  code: "ABCD-1234",
  tier: "pass",
  issued_at: "2026-01-12T09:00:00Z",
  revoked: false,
  student: { id: "0190a000-0000-4000-8000-0000000000e4", name: "Aziza Karimova" },
}

let settings: CertSettings = structuredClone(certSettingsFixture)
let templates: CertTemplate[] = [structuredClone(templateFixture)]
let partners: CertPartner[] = [structuredClone(partnerFixture)]
let issued: CertIssued[] = [structuredClone(issuedFixture)]

export function resetLmsCertificatesState(): void {
  settings = structuredClone(certSettingsFixture)
  templates = [structuredClone(templateFixture)]
  partners = [structuredClone(partnerFixture)]
  issued = [structuredClone(issuedFixture)]
}

const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const PDF = new TextEncoder().encode("%PDF-1.4\n%%EOF\n")

export const lmsCertificatesHandlers = [
  http.get(apiUrl("/v1/certificates/courses/issued/:certId/pdf"), () =>
    HttpResponse.arrayBuffer(PDF.buffer as ArrayBuffer, { headers: { "Content-Type": "application/pdf" } }),
  ),
  http.get(apiUrl("/v1/certificates/verify/:code"), ({ params }) => {
    const found = issued.find((c) => c.code === param(params, "code"))
    if (!found) return notFound("Certificate")
    const body: CertVerification = {
      status: found.revoked ? "revoked" : "valid",
      holder_name: found.student.name,
      course_title: "Algebra I",
      issued_at: found.issued_at,
      tier_label: labels("Pass", "Зачёт", "Oʼtdi"),
      partner: null,
      qr_svg_url: `/v1/certificates/verify/${found.code}/qr.svg`,
    }
    return HttpResponse.json(body)
  }),
  http.get(apiUrl("/v1/certificates/courses/:courseId/settings"), () => HttpResponse.json(settings)),
  http.put(apiUrl("/v1/certificates/courses/:courseId/settings"), async ({ request }) => {
    settings = { ...settings, ...(await readJson<CertSettings>(request)) }
    return HttpResponse.json(settings)
  }),
  http.get(apiUrl("/v1/certificates/courses/:courseId/templates"), () => HttpResponse.json({ items: templates })),
  http.post(apiUrl("/v1/certificates/courses/:courseId/templates"), async ({ request }) => {
    const { name } = await readJson<{ name: string }>(request)
    const template: CertTemplate = { ...structuredClone(templateFixture), id: nextId(0xe5), name: name ?? "" }
    templates = [...templates, template]
    return HttpResponse.json(template)
  }),
  http.get(apiUrl("/v1/certificates/courses/:courseId/templates/:templateId/preview.png"), () =>
    HttpResponse.arrayBuffer(PNG.buffer as ArrayBuffer, { headers: { "Content-Type": "image/png" } }),
  ),
  http.post(apiUrl("/v1/certificates/courses/:courseId/templates/:templateId/background"), ({ params }) => {
    const id = param(params, "templateId")
    const old = templates.find((t) => t.id === id)
    if (!old) return notFound("Template")
    const template = { ...old, background_url: `/v1/certificates/templates/${id}/background.png` }
    templates = templates.map((t) => (t.id === id ? template : t))
    return HttpResponse.json(template)
  }),
  http.put(apiUrl("/v1/certificates/courses/:courseId/templates/:templateId"), async ({ request, params }) => {
    const id = param(params, "templateId")
    const old = templates.find((t) => t.id === id)
    if (!old) return notFound("Template")
    const template = { ...old, ...(await readJson<CertTemplate>(request)), id }
    templates = templates.map((t) => (t.id === id ? template : t))
    return HttpResponse.json(template)
  }),
  http.delete(apiUrl("/v1/certificates/courses/:courseId/templates/:templateId"), ({ params }) => {
    templates = templates.filter((t) => t.id !== param(params, "templateId"))
    return noContent()
  }),
  http.get(apiUrl("/v1/certificates/courses/:courseId/partners"), () => HttpResponse.json({ items: partners })),
  http.post(apiUrl("/v1/certificates/courses/:courseId/partners"), async ({ request }) => {
    const body = await readJson<CertPartnerBody>(request)
    const partner: CertPartner = {
      id: nextId(0xe6),
      name: body.name ?? "",
      url: body.url ?? null,
      co_issued: body.co_issued ?? false,
      logo_url: null,
    }
    partners = [...partners, partner]
    return HttpResponse.json(partner)
  }),
  http.post(apiUrl("/v1/certificates/courses/:courseId/partners/:partnerId/logo"), ({ params }) => {
    const id = param(params, "partnerId")
    const old = partners.find((p) => p.id === id)
    if (!old) return notFound("Partner")
    const partner = { ...old, logo_url: `/v1/certificates/partners/${id}/logo.png` }
    partners = partners.map((p) => (p.id === id ? partner : p))
    return HttpResponse.json(partner)
  }),
  http.put(apiUrl("/v1/certificates/courses/:courseId/partners/:partnerId"), async ({ request, params }) => {
    const id = param(params, "partnerId")
    const old = partners.find((p) => p.id === id)
    if (!old) return notFound("Partner")
    const partner = { ...old, ...(await readJson<CertPartnerBody>(request)), id }
    partners = partners.map((p) => (p.id === id ? partner : p))
    return HttpResponse.json(partner)
  }),
  http.delete(apiUrl("/v1/certificates/courses/:courseId/partners/:partnerId"), ({ params }) => {
    partners = partners.filter((p) => p.id !== param(params, "partnerId"))
    return noContent()
  }),
  http.get(apiUrl("/v1/certificates/courses/:courseId/issued"), () => HttpResponse.json({ items: issued })),
  http.post(apiUrl("/v1/certificates/courses/:courseId/issue-eligible"), () => HttpResponse.json({ issued: 0 })),
  http.post(apiUrl("/v1/certificates/courses/:courseId/issued/:certId/revoke"), ({ params }) => {
    issued = issued.map((c) => (c.id === param(params, "certId") ? { ...c, revoked: true } : c))
    return noContent()
  }),
  http.post(apiUrl("/v1/certificates/courses/:courseId/mine"), () => {
    const body: MyCourseCertificateStatus = {
      eligible: true,
      passing_pct: settings.passing_pct,
      progress_pct: 100,
      enabled: true,
      score_pct: 100,
      required_steps_left: 0,
      next_tier: null,
      certificate: {
        id: issuedFixture.id,
        code: issuedFixture.code,
        issued_at: issuedFixture.issued_at,
        revoked: false,
        tier: labels("Pass", "Зачёт", "Oʼtdi"),
        pdf_url: `/v1/certificates/courses/issued/${issuedFixture.id}/pdf`,
        verify_url: `/verify/${issuedFixture.code}`,
      },
    }
    return HttpResponse.json(body)
  }),
  http.get(apiUrl("/v1/certificates/courses/:courseId/public"), () => {
    const body: CoursePublicCertificates = {
      enabled: settings.enabled,
      passing_pct: settings.passing_pct,
      sample_url: null,
      tiers: settings.tiers.map((t) => t.label),
      partners: partners.map((p) => ({ name: p.name, url: p.url, logo_url: p.logo_url })),
    }
    return HttpResponse.json(body)
  }),
]
