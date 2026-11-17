"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { useQuery } from "@tanstack/react-query"
import { careerMajorsQuery, pick } from "../../career/api"
import { useOptionLabel } from "../../chooser/components/option-label"

type Loose = { (key: string): string; has: (key: string) => boolean }

/** `computer_science` or `natural-sciences` as "Computer science", for a value no dictionary knows. */
export function humanize(value: string): string {
  const words = value.replace(/[_-]+/g, " ").trim()
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : value
}

/**
 * Label of a preference tag: the `prefs.tags.<key with "_">` copy, a career major name for `major:<code>`,
 * a country name for `region:<cc>`, else the humanized value. Never the raw `prefix:value` key.
 */
export function useTagLabel(): (tag: string) => string {
  const t = useT("prefs") as unknown as Loose
  const locale = useLocale()
  const country = useOptionLabel("country")
  const majors = useQuery(careerMajorsQuery())
  const majorNames = new Map(
    (majors.data?.items ?? []).map((major) => [major.code.toLowerCase(), pick(major.name, locale)]),
  )
  return (tag) => {
    const key = `tags.${tag.replace(/:/g, "_")}`
    if (t.has(key)) return t(key)
    const at = tag.indexOf(":")
    const prefix = at < 0 ? "" : tag.slice(0, at)
    const value = at < 0 ? tag : tag.slice(at + 1)
    if (prefix === "major") {
      const name = majorNames.get(value.toLowerCase()) ?? majorNames.get(value.replace(/-/g, "_").toLowerCase())
      if (name) return name
    }
    if (prefix === "region" && /^[a-z]{2}$/i.test(value)) return country(value)
    return humanize(value)
  }
}
