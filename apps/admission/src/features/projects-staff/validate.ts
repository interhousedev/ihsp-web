import type { HelperIn } from "../projects/api"

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const PHONE = /^\+?[0-9][0-9 ()-]{5,24}$/
const TELEGRAM = /^(@[A-Za-z][A-Za-z0-9_]{4,31}|https:\/\/t\.me\/[A-Za-z0-9_+/]{2,64})$/

export type HelperErrors = Partial<
  Record<"name" | "description" | "tags" | "email" | "phone" | "telegram" | "website", true>
>

/** Mirrors the backend rules; every contact is optional, an empty one is skipped. */
export function validateHelper(h: HelperIn): HelperErrors {
  const errors: HelperErrors = {}
  const c = h.contacts
  if (!h.name.trim()) errors.name = true
  if (!h.description.en.trim() || !h.description.ru.trim() || !h.description.uz.trim()) errors.description = true
  if (h.tags.length === 0) errors.tags = true
  if (c.email && !EMAIL.test(c.email.trim())) errors.email = true
  if (c.phone && !PHONE.test(c.phone.trim())) errors.phone = true
  if (c.telegram && !TELEGRAM.test(c.telegram.trim())) errors.telegram = true
  if (c.website && !/^https?:\/\/\S+$/.test(c.website.trim())) errors.website = true
  return errors
}

/** Trimmed copy ready to send. */
export function cleanHelper(h: HelperIn): HelperIn {
  const t = (s: string) => s.trim()
  return {
    ...h,
    name: t(h.name),
    city: t(h.city),
    description: { en: t(h.description.en), ru: t(h.description.ru), uz: t(h.description.uz) },
    expertise_areas: h.expertise_areas.map(t).filter(Boolean),
    contacts: {
      email: t(h.contacts.email),
      phone: t(h.contacts.phone),
      telegram: t(h.contacts.telegram),
      website: t(h.contacts.website),
    },
  }
}
