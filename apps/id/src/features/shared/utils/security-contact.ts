/**
 * Splits the security contact text (`IHSP_WEB_SECURITY_CONTACT`, plain text such as "alex@sayfi.uz, @megaplov (Telegram)")
 * into text and links. Only a strict email and a strict Telegram handle become links; everything else stays text.
 * The parts are rendered as React nodes, never as HTML.
 */

export type SecurityContactPart =
  | { kind: "text"; text: string }
  | { kind: "email"; text: string; href: string }
  | { kind: "telegram"; text: string; href: string }

/**
 * Email: a local part, "@", a domain with at least one dot and a letter-ending TLD. Telegram handle: "@", a letter, 3 to 30
 * letters, digits or underscores, and a letter or digit at the end (Telegram usernames are 5 to 32 characters). The handle
 * must not follow a word character or "@", so the domain of an email is never read as a handle.
 */
const CONTACT_PATTERN =
  /([A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,})|(?<![\w@])@([A-Za-z][A-Za-z0-9_]{3,30}[A-Za-z0-9])(?!\w)/g

export function parseSecurityContact(contact: string): SecurityContactPart[] {
  const parts: SecurityContactPart[] = []
  let last = 0
  for (const match of contact.matchAll(CONTACT_PATTERN)) {
    const index = match.index
    if (index > last) parts.push({ kind: "text", text: contact.slice(last, index) })
    if (match[1] !== undefined) {
      parts.push({ kind: "email", text: match[1], href: `mailto:${match[1]}` })
    } else {
      parts.push({ kind: "telegram", text: match[0], href: `https://t.me/${match[2]}` })
    }
    last = index + match[0].length
  }
  if (last < contact.length) parts.push({ kind: "text", text: contact.slice(last) })
  return parts
}
