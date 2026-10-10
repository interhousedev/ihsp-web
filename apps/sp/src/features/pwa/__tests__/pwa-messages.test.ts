/** GEN-3: the texts of the installable app exist in uz, ru and en, and every key used in the code has a message. */
import { describe, expect, test } from "bun:test"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import type { Messages } from "@ihsp/i18n"

const FEATURE = join(import.meta.dir, "..")
const MESSAGES = join(import.meta.dir, "..", "..", "..", "..", "messages")

function load(locale: string): Messages {
  return JSON.parse(readFileSync(join(MESSAGES, locale, "pwa.json"), "utf8")) as Messages
}

function flatten(tree: Messages, prefix = ""): Map<string, string> {
  const result = new Map<string, string>()
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === "string") result.set(path, value)
    else for (const [inner, text] of flatten(value, path)) result.set(inner, text)
  }
  return result
}

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return name === "__tests__" ? [] : sources(path)
    return /\.tsx?$/.test(name) ? [path] : []
  })
}

function argumentNames(text: string): string[] {
  const names = new Set<string>()
  for (const match of text.matchAll(/\{(\w+)(?:,|\})/g)) names.add(match[1] as string)
  return [...names].toSorted()
}

const en = flatten(load("en"))
const ru = flatten(load("ru"))
const uz = flatten(load("uz"))

describe("pwa messages", () => {
  test("uz and ru have exactly the keys of en", () => {
    expect([...ru.keys()].toSorted()).toEqual([...en.keys()].toSorted())
    expect([...uz.keys()].toSorted()).toEqual([...en.keys()].toSorted())
  })

  test("no message is empty", () => {
    for (const [locale, map] of [
      ["en", en],
      ["ru", ru],
      ["uz", uz],
    ] as const) {
      for (const [key, text] of map) expect(text.trim(), `${locale}: ${key}`).not.toBe("")
    }
  })

  test("a message uses the same arguments in every language", () => {
    for (const [key, text] of en) {
      expect(argumentNames(ru.get(key) ?? ""), `ru: ${key}`).toEqual(argumentNames(text))
      expect(argumentNames(uz.get(key) ?? ""), `uz: ${key}`).toEqual(argumentNames(text))
    }
  })

  test("every key is under the pwa namespace", () => {
    for (const key of en.keys()) expect(key.startsWith("pwa.")).toBe(true)
  })
})

describe("keys used in the code", () => {
  const used = new Set<string>()
  const dynamic = new Set<string>()
  for (const file of sources(FEATURE)) {
    const text = readFileSync(file, "utf8")
    if (!/useT\(\s*"pwa"\s*\)/.test(text)) continue
    for (const match of text.matchAll(/\bt\(\s*(["`])([^"`]+)\1/g)) {
      const key = `pwa.${match[2]}`
      if (key.includes("${")) dynamic.add(key)
      else used.add(key)
    }
    expect(relative(FEATURE, file)).toBeTruthy()
  }

  test("the scan found the keys", () => {
    expect(used.size).toBeGreaterThan(20)
  })

  test("every key used in the code has an English message", () => {
    expect([...used].filter((key) => !en.has(key))).toEqual([])
  })

  test("the keys built at run time have messages for every value", () => {
    expect([...dynamic].toSorted()).toEqual([
      "pwa.benefits.${key}",
    ])
    for (const value of ["fast", "offline", "session", "push"]) expect(en.has(`pwa.benefits.${value}`)).toBe(true)
  })

  test("every message is used somewhere", () => {
    const unused = [...en.keys()].filter(
      (key) =>
        !used.has(key) &&
        !key.startsWith("pwa.benefits.") &&
        !key.startsWith("pwa.lock."),
    )
    expect(unused).toEqual([])
  })
})
