import {
  IconBinaryTree2,
  IconBulb,
  IconCards,
  IconFileText,
  IconHelpCircle,
  IconLanguage,
  IconListCheck,
  IconNotes,
  IconPresentation,
  IconTable,
  IconTarget,
  type Icon,
} from "@tabler/icons-react"

/**
 * The slash commands of every AI composer (assistant and notebook chat). The client only offers and sends them as
 * `{command, args}`; the backend (`app/shared/slash_commands.py`) decides what each one does.
 */
export const SLASH_NAMES = [
  "goal",
  "cards",
  "quiz",
  "summary",
  "mindmap",
  "slides",
  "report",
  "table",
  "explain",
  "translate",
  "help",
] as const

export type SlashName = (typeof SLASH_NAMES)[number]

export type SlashCommandInfo = { name: SlashName; icon: Icon }

export const SLASH_COMMANDS: readonly SlashCommandInfo[] = [
  { name: "goal", icon: IconTarget },
  { name: "cards", icon: IconCards },
  { name: "quiz", icon: IconListCheck },
  { name: "summary", icon: IconNotes },
  { name: "mindmap", icon: IconBinaryTree2 },
  { name: "slides", icon: IconPresentation },
  { name: "report", icon: IconFileText },
  { name: "table", icon: IconTable },
  { name: "explain", icon: IconBulb },
  { name: "translate", icon: IconLanguage },
  { name: "help", icon: IconHelpCircle },
]

/** A command with what follows it: `/cards photosynthesis` is `{name: "cards", args: "photosynthesis"}`. */
export type SlashCall = { name: SlashName; args: string }

export function isSlashName(value: string): value is SlashName {
  return (SLASH_NAMES as readonly string[]).includes(value)
}

export function slashInfo(name: SlashName): SlashCommandInfo {
  return SLASH_COMMANDS.find((item) => item.name === name) ?? (SLASH_COMMANDS[0] as SlashCommandInfo)
}

/** The short text a chat stores for a command: `/cards photosynthesis`. */
export function slashText(call: SlashCall): string {
  return `/${call.name} ${call.args}`.trim()
}

/** Reads a stored or typed `/name args` (known names only, case-insensitive); anything else is plain text. */
export function parseSlashText(text: string): SlashCall | null {
  const match = /^\/([A-Za-z][A-Za-z0-9_-]*)(?:\s+([\s\S]*))?$/.exec(text.trim())
  if (!match) return null
  const name = (match[1] ?? "").toLowerCase()
  return isSlashName(name) ? { name, args: (match[2] ?? "").trim() } : null
}

/** `/car` while the user is still typing the name: the filter text, or `null` when the field is not a command start. */
export function slashQuery(text: string): string | null {
  const match = /^\/([A-Za-z0-9_-]*)$/.exec(text)
  return match ? (match[1] ?? "").toLowerCase() : null
}

export type SlashLabels = (name: SlashName) => { title: string; hint: string }

/** Commands whose name starts with the query come first, then those whose name, title or hint contain it. */
export function filterSlash(query: string, labels: SlashLabels): SlashCommandInfo[] {
  const q = query.trim().toLowerCase()
  if (q === "") return [...SLASH_COMMANDS]
  const starts: SlashCommandInfo[] = []
  const contains: SlashCommandInfo[] = []
  for (const item of SLASH_COMMANDS) {
    if (item.name.startsWith(q)) {
      starts.push(item)
      continue
    }
    const { title, hint } = labels(item.name)
    if ([item.name, title, hint].some((value) => value.toLowerCase().includes(q))) contains.push(item)
  }
  return [...starts, ...contains]
}
