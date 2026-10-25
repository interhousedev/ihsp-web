import { z } from "zod"

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

/** A course address from its title: lower case Latin letters, digits and dashes, at most 60 characters. */
export function slugify(title: string): string {
  const latin = [...title.toLowerCase()].map((char) => CYRILLIC[char] ?? char).join("")
  return latin
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "")
}

export const SLUG_PATTERN = /^[a-z0-9-]{3,60}$/

/** The new-course form (backend: slug `[a-z0-9-]{3,60}`, unique). */
export const courseFormSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z.string().regex(SLUG_PATTERN),
  visibility: z.enum(["public", "invite"]),
})

export type CourseFormValues = z.infer<typeof courseFormSchema>
