/** The lock texts exist in uz, ru and en, including the keys built at run time. */
import { describe, expect, test } from "bun:test"
import en from "@ihsp/i18n/messages/en.json"
import ru from "@ihsp/i18n/messages/ru.json"
import uz from "@ihsp/i18n/messages/uz.json"
import { RELOCK_OPTIONS } from "../lock-policy"

type Tree = { [key: string]: string | Tree }
function keys(tree: Tree, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([k, v]) => (typeof v === "string" ? [prefix + k] : keys(v, `${prefix}${k}.`)))
}
const lock = (messages: unknown) => (messages as { pwa: { lock: Tree } }).pwa.lock

describe("lock messages", () => {
  test("uz and ru have the keys of en", () => {
    expect(keys(lock(ru)).toSorted()).toEqual(keys(lock(en)).toSorted())
    expect(keys(lock(uz)).toSorted()).toEqual(keys(lock(en)).toSorted())
  })

  test("run-time keys have messages", () => {
    const all = new Set(keys(lock(en)))
    for (const o of RELOCK_OPTIONS) expect(all.has(`settings.relock.options.${o}`)).toBe(true)
    for (const e of ["length", "mismatch", "wrong", "storage"]) expect(all.has(`settings.errors.${e}`)).toBe(true)
  })
})
