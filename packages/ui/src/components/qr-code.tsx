"use client"

import { useT } from "@ihsp/i18n"
import { lazy, Suspense } from "react"

const QrCodeSvg = lazy(() => import("./qr-code-svg"))

/** QR code for a link such as `https://t.me/<bot>`; white quiet zone so phone cameras read it in dark mode too. */
export function QrCode({ value, size = 176, label }: { value: string; size?: number; label?: string }) {
  const t = useT()
  return (
    <div className="inline-block rounded-lg bg-white p-3" role="img" aria-label={label ?? t("qr.alt")}>
      <Suspense fallback={<div style={{ width: size, height: size }} />}>
        <QrCodeSvg value={value} size={size} />
      </Suspense>
    </div>
  )
}
