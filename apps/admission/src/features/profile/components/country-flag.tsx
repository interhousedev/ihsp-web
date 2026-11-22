"use client"

import { useState } from "react"

/** Vendored SVG flag (`public/flags/<cc>.svg`, flag-icons, MIT); emoji flags do not render on Windows. Decorative. */
export function CountryFlag({ code }: { code: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return null
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/flags/${code.toLowerCase()}.svg`}
      alt=""
      aria-hidden
      width={16}
      height={12}
      className="h-3 w-4 shrink-0 rounded-[2px] object-cover"
      onError={() => setFailed(true)}
    />
  )
}
