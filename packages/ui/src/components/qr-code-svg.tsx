"use client"

import { QRCodeSVG } from "qrcode.react"

/** The `qrcode.react` renderer, a separate chunk: pages that never show a QR code don't download it. */
export default function QrCodeSvg({ value, size }: { value: string; size: number }) {
  return <QRCodeSVG value={value} size={size} level="M" bgColor="#ffffff" fgColor="#000000" />
}
