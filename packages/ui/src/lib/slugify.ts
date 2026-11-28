const CYRILLIC: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
  ў: "o",
  қ: "q",
  ғ: "g",
  ҳ: "h",
}

/** An address (slug) from a title: lower case Latin letters, digits and dashes, at most 60 characters. */
export function slugify(title: string): string {
  const latin = [...title.toLowerCase()].map((char) => CYRILLIC[char] ?? char).join("")
  const dashed = latin.normalize("NFKD").replace(/[^a-z0-9]+/g, "-")
  let start = 0
  let end = dashed.length
  while (start < end && dashed[start] === "-") start++
  while (end > start && dashed[end - 1] === "-") end--
  let out = dashed.slice(start, end).slice(0, 60)
  while (out.endsWith("-")) out = out.slice(0, -1)
  return out
}
