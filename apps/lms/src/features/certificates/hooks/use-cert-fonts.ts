"use client"

import { CERT_FONTS, certFontUrl, type CertFont, type CertLabels } from "@ihsp/api"
import { useEffect, useState } from "react"

/** CSS family name under which a certificate font is registered in the page. */
export const certFamily = (font: CertFont) => `ihsp-cert-${font}`

let loading: Promise<void> | null = null

/**
 * Registers the five certificate fonts (served by the API, the same files the server renders with) so the canvas and
 * the font picker show the real faces. Returns `true` once they are loaded; on failure the fallback serif shows.
 */
export function useCertFonts(): boolean {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let alive = true
    loading ??= Promise.all(
      CERT_FONTS.map(async (font) => {
        const face = new FontFace(certFamily(font), `url(${certFontUrl(font)}) format("truetype")`, {
          weight: "100 900",
        })
        document.fonts.add(await face.load())
      }),
    ).then(
      () => undefined,
      () => {
        loading = null
      },
    )
    void loading.then(() => alive && setReady(true))
    return () => {
      alive = false
    }
  }, [])
  return ready
}

/** A label in the reader's language, falling back to English. */
export function pickLabel(labels: CertLabels, locale: string): string {
  return labels[locale as keyof CertLabels] || labels.en
}
