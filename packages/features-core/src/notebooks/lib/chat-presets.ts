import type { ChatConfig } from "@ihsp/api"

/** The parts of a chat configuration that a preset sets (the answer language and the goal are the student's own). */
export type ChatPresetConfig = Pick<ChatConfig, "style" | "custom_prompt" | "length">

/** The localized instructions of the presets that use the custom style. */
export type ChatPresetPrompts = { exam: string; simple: string; depth: string }

export type ChatPresetId = "balanced" | "tutor" | "exam" | "simple" | "depth"

export type ChatPreset = {
  id: ChatPresetId
  /** The configuration the preset fills, given the instructions in the language of the interface. */
  patch: (prompts: ChatPresetPrompts) => ChatPresetConfig
}

/** The presets of the Configure chat dialog, in the order of its buttons. */
export const CHAT_PRESETS: readonly ChatPreset[] = [
  { id: "balanced", patch: () => ({ style: "default", custom_prompt: null, length: "default" }) },
  { id: "tutor", patch: () => ({ style: "learning_guide", custom_prompt: null, length: "default" }) },
  { id: "exam", patch: (prompts) => ({ style: "custom", custom_prompt: prompts.exam, length: "default" }) },
  { id: "simple", patch: (prompts) => ({ style: "custom", custom_prompt: prompts.simple, length: "shorter" }) },
  { id: "depth", patch: (prompts) => ({ style: "custom", custom_prompt: prompts.depth, length: "longer" }) },
]

/** The configuration a preset fills. */
export function presetPatch(id: ChatPresetId, prompts: ChatPresetPrompts): ChatPresetConfig {
  const preset = CHAT_PRESETS.find((item) => item.id === id)
  return (preset ?? CHAT_PRESETS[0]!).patch(prompts)
}

/** The custom text only counts under the custom style; blank is none. */
function effectivePrompt(config: ChatPresetConfig): string | null {
  if (config.style !== "custom") return null
  const text = config.custom_prompt?.trim() ?? ""
  return text === "" ? null : text
}

/**
 * The preset whose configuration is exactly this one (style, custom text and length), or `null`: a preset is only a
 * shortcut, so any edit leaves no button pressed. The answer language and the goal are not part of it.
 */
export function presetOf(config: ChatPresetConfig, prompts: ChatPresetPrompts): ChatPresetId | null {
  const prompt = effectivePrompt(config)
  const found = CHAT_PRESETS.find((preset) => {
    const patch = preset.patch(prompts)
    return patch.style === config.style && patch.length === config.length && effectivePrompt(patch) === prompt
  })
  return found?.id ?? null
}
