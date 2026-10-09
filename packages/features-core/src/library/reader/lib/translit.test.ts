import { describe, expect, it } from "bun:test"
import { OKINA, TUTUQ, findInText, normalizeWithMap, searchNormalize, uzTranslit } from "./translit"

// The vectors of docs/reference/study-library.md § 11.1 and of backend/tests/shared/test_uz_translit.py.
const VECTORS: [string, string][] = [
  ["ўзбек", `o${OKINA}zbek`],
  ["ғазал", `g${OKINA}azal`],
  ["қалам", "qalam"],
  ["ҳаво", "havo"],
  ["шаҳар", "shahar"],
  ["чой", "choy"],
  ["ёш", "yosh"],
  ["юрак", "yurak"],
  ["яхши", "yaxshi"],
  ["маъно", `ma${TUTUQ}no`],
  ["цирк", "tsirk"],
  ["эшик", "eshik"],
  ["жўжа", `jo${OKINA}ja`],
  ["щётка", "shyotka"],
  ["объект", `ob${TUTUQ}yekt`],
  ["сентябрь", "sentyabr"],
  ["бизнес", "biznes"],
  ["рыба", "riba"],
]

const YE_VECTORS: [string, string][] = [
  ["Европа", "yevropa"],
  ["етти", "yetti"],
  ["мен ва ер", "men va yer"],
  ["уезд", "uyezd"],
  ["шеър", `she${TUTUQ}r`],
  ["бегона", "begona"],
  ["олтин-ер", "oltin-yer"],
  ["съезд", `s${TUTUQ}yezd`],
]

const APOSTROPHES = ["'", "\u02bb", "\u02bc", "\u2018", "\u2019", "\u201b", "`", "\u00b4", "\u2032", "\u02b9"]

describe("uzTranslit", () => {
  it.each(VECTORS)("turns %s into %s", (cyrillic, latin) => {
    expect(uzTranslit(cyrillic)).toBe(latin)
  })

  it.each(YE_VECTORS)(
    "reads е as ye at the start of a word and after a vowel or a sign: %s -> %s",
    (cyrillic, latin) => {
      expect(uzTranslit(cyrillic)).toBe(latin)
    },
  )

  it("lowers the case before it converts", () => {
    expect(uzTranslit("Ўзбекистон ЕВРОПА")).toBe(`o${OKINA}zbekiston yevropa`)
  })

  it("reads a base letter plus a combining mark as one letter", () => {
    expect(uzTranslit("ўзбек")).toBe(`o${OKINA}zbek`)
    expect(uzTranslit("ёш")).toBe("yosh")
  })

  it.each(APOSTROPHES)("makes every apostrophe after o or g one okina (U+%s)", (mark) => {
    expect(uzTranslit(`o${mark}zbek`)).toBe(`o${OKINA}zbek`)
    expect(uzTranslit(`G${mark}azal`)).toBe(`g${OKINA}azal`)
    expect(uzTranslit(`TO${mark}G${mark}RI`)).toBe(`to${OKINA}g${OKINA}ri`)
  })

  it.each(APOSTROPHES)("makes every other apostrophe one tutuq (U+%s)", (mark) => {
    expect(uzTranslit(`ma${mark}no`)).toBe(`ma${TUTUQ}no`)
    expect(uzTranslit(`e${mark}lon`)).toBe(`e${TUTUQ}lon`)
  })

  it("gives one form for the Cyrillic word and its Latin spellings", () => {
    const forms = new Set(["ўзбек", "o\u02bbzbek", "o'zbek", "O\u2019ZBEK"].map((word) => uzTranslit(word)))

    expect([...forms]).toEqual([`o${OKINA}zbek`])
  })

  it("meets a hard sign after o and a Latin apostrophe after o on the okina", () => {
    expect(uzTranslit("тоъ")).toBe(uzTranslit("to'"))
    expect(uzTranslit("тоъ")).toBe(`to${OKINA}`)
  })

  it("keeps digits, punctuation and Latin letters", () => {
    expect(uzTranslit("Grade 10, A-1 (2024)!")).toBe("grade 10, a-1 (2024)!")
  })

  it("collapses whitespace and strips the ends", () => {
    expect(uzTranslit("  ўзбек \t\n тили  ")).toBe(`o${OKINA}zbek tili`)
    expect(uzTranslit("   ")).toBe("")
    expect(uzTranslit("")).toBe("")
  })

  it.each(["ru", "en", "RU", "de"])("only lowers and tidies text when the language is %s", (language) => {
    expect(uzTranslit("  Ёлка  Ўзбек\u2019s   o'zbek \n", language)).toBe("ёлка ўзбек\u2019s o'zbek")
  })

  it("leaves Russian text in Cyrillic", () => {
    expect(uzTranslit("Привет,   Мир", "ru")).toBe("привет, мир")
  })

  it.each(["uz", "UZ", "uz-Cyrl", "uz_Latn"])("transliterates for the language tag %s", (language) => {
    expect(uzTranslit("ўзбек", language)).toBe(`o${OKINA}zbek`)
  })

  it.each(["ўзбек", "ғазал", "маъно", "Европа", "O\u2018ZBEK", "TO\u2018G\u2018RI", "  a   b ", "тоъ", "сўъзъ", "г'ъ"])(
    "is idempotent for %s",
    (word) => {
      const once = uzTranslit(word)

      expect(uzTranslit(once)).toBe(once)
    },
  )

  it("searchNormalize is the same function", () => {
    expect(searchNormalize("  Ўзбек   TILI\n")).toBe(`o${OKINA}zbek tili`)
    expect(searchNormalize("  Война   и МИР ", "ru")).toBe("война и мир")
  })
})

describe("normalizeWithMap", () => {
  it("gives the same text as uzTranslit", () => {
    for (const [cyrillic] of [...VECTORS, ...YE_VECTORS]) {
      expect(normalizeWithMap(cyrillic).text).toBe(uzTranslit(cyrillic))
    }
    expect(normalizeWithMap("  O'zbek \n tili ").text).toBe(uzTranslit("  O'zbek \n tili "))
    expect(normalizeWithMap("Привет  Мир", "ru").text).toBe("привет мир")
  })

  it("maps every output character back to its source", () => {
    const source = "Ўзбек тили"
    const mapped = normalizeWithMap(source)

    expect(mapped.text).toBe(`o${OKINA}zbek tili`)
    // `ў` is two output letters (o, okina) with one source letter.
    expect(mapped.starts.slice(0, 2)).toEqual([0, 0])
    expect(mapped.ends.slice(0, 2)).toEqual([1, 1])
    expect(source.slice(mapped.starts[2], mapped.ends[2])).toBe("з")
  })
})

describe("findInText", () => {
  const page = "Ўзбек тили — o\u02bbzbek tilidir. O'ZBEK adabiyoti. Ruscha: узбек."

  it("finds the Cyrillic and every Latin spelling for one query", () => {
    const hits = findInText(page, "o'zbek")

    expect(hits.map((hit) => page.slice(hit.start, hit.end))).toEqual(["Ўзбек", "o\u02bbzbek", "O'ZBEK"])
  })

  it("accepts a Cyrillic query for Latin text", () => {
    const hits = findInText(page, "ўзбек")

    expect(hits).toHaveLength(3)
  })

  it("does not transliterate Russian items", () => {
    const hits = findInText("Узбек и ўзбек", "узбек", "ru")

    expect(hits.map((hit) => "Узбек и ўзбек".slice(hit.start, hit.end))).toEqual(["Узбек"])
  })

  it("returns nothing for an empty query and respects the limit", () => {
    expect(findInText(page, "   ")).toEqual([])
    expect(findInText("aaaa", "a", "en", 2)).toHaveLength(2)
  })

  it("matches across a line break as one space", () => {
    const text = "ma\u02bcno\nsi va  qimmati"
    const hits = findInText(text, "va qimmati")

    expect(hits.map((hit) => text.slice(hit.start, hit.end))).toEqual(["va  qimmati"])
  })
})
