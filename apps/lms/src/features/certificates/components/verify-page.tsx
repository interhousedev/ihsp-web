"use client"

import { certAssetUrl, getCertVerificationQuery } from "@ihsp/api"
import { useFormatters, useLocale, useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Label,
  PageContainer,
  StateView,
} from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useId, useState } from "react"
import { hrefs } from "../../shared/utils/hrefs"
import { pickLabel } from "../hooks/use-cert-fonts"
import { PartnerLogo } from "./partners-tab"

const CODE_MAX = 64

/** `/verify/?code=`: the public check of a certificate, with a form to type the code by hand. */
export function VerifyPage({ code }: { code: string | null }) {
  const t = useT("courseCertificates")
  const router = useRouter()
  const [value, setValue] = useState(code ?? "")
  const inputId = useId()
  return (
    <PageContainer title={t("verify.title")}>
      <div className="flex max-w-2xl flex-col gap-4">
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            const next = value.trim()
            if (next) router.push(hrefs.verify(next))
          }}
        >
          <Label htmlFor={inputId}>{t("verify.code")}</Label>
          <div className="flex gap-2">
            <Input
              id={inputId}
              value={value}
              maxLength={CODE_MAX}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => setValue(e.target.value)}
              className="min-h-11 font-mono md:min-h-9"
            />
            <Button type="submit" disabled={value.trim() === ""} className="min-h-11 md:min-h-9">
              {t("verify.check")}
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">{t("verify.codeHint")}</p>
        </form>
        {code ? <VerifyResult key={code} code={code} /> : null}
      </div>
    </PageContainer>
  )
}

function VerifyResult({ code }: { code: string }) {
  const t = useT("courseCertificates")
  const locale = useLocale()
  const format = useFormatters()
  const result = useQuery({ ...getCertVerificationQuery(code), retry: false })
  if (result.isPending) return <StateView state="loading" />
  if (result.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{t("verify.notFound")}</AlertDescription>
      </Alert>
    )
  }
  const data = result.data
  const valid = data.status === "valid"
  return (
    <Card data-testid="verify-result">
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Badge variant={valid ? "default" : "destructive"} className="self-start">
            {valid ? t("verify.valid") : t("verify.revoked")}
          </Badge>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">{t("verify.holder")}</dt>
            <dd className="font-medium break-words">{data.holder_name}</dd>
            <dt className="text-muted-foreground">{t("verify.course")}</dt>
            <dd className="break-words">{data.course_title}</dd>
            <dt className="text-muted-foreground">{t("verify.tier")}</dt>
            <dd>{pickLabel(data.tier_label, locale)}</dd>
            <dt className="text-muted-foreground">{t("verify.issuedAt")}</dt>
            <dd className="tabular-nums">{format.date(data.issued_at)}</dd>
            <dt className="text-muted-foreground">{t("verify.codeLabel")}</dt>
            <dd className="font-mono text-xs break-all">{code}</dd>
          </dl>
          {data.partner ? (
            <div className="flex items-center gap-3 pt-2">
              <PartnerLogo partner={data.partner} />
              <span className="text-sm">{t("verify.partner", { name: data.partner.name })}</span>
            </div>
          ) : null}
        </div>
        <img
          src={certAssetUrl(data.qr_svg_url)}
          alt={t("verify.qrAlt")}
          className="size-32 shrink-0 self-center rounded-md border bg-white p-1"
        />
      </CardContent>
    </Card>
  )
}
