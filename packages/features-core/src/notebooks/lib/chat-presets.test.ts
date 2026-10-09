import { describe, expect, it } from "bun:test"
import { CHAT_PRESETS, presetOf, presetPatch, type ChatPresetId, type ChatPresetPrompts } from "./chat-presets"

const prompts: ChatPresetPrompts = {
  exam: "Answer like an examiner's checklist.",
  simple: "Explain in plain, simple words.",
  depth: "Give a thorough, detailed explanation.",
}

describe("presetPatch", () => {
  it("fills style, custom text and length of every preset", () => {
    expect(presetPatch("balanced", prompts)).toEqual({ style: "default", custom_prompt: null, length: "default" })
    expect(presetPatch("tutor", prompts)).toEqual({ style: "learning_guide", custom_prompt: null, length: "default" })
    expect(presetPatch("exam", prompts)).toEqual({ style: "custom", custom_prompt: prompts.exam, length: "default" })
    expect(presetPatch("simple", prompts)).toEqual({ style: "custom", custom_prompt: prompts.simple, length: "shorter" })
    expect(presetPatch("depth", prompts)).toEqual({ style: "custom", custom_prompt: prompts.depth, length: "longer" })
  })

  it("lists the presets in the order of the buttons", () => {
    expect(CHAT_PRESETS.map((preset) => preset.id)).toEqual(["balanced", "tutor", "exam", "simple", "depth"])
  })
})

describe("presetOf", () => {
  it("finds the preset a configuration was filled from", () => {
    for (const { id } of CHAT_PRESETS) expect(presetOf(presetPatch(id, prompts), prompts)).toBe(id)
  })

  it("ignores the answer language and the goal", () => {
    const config = { ...presetPatch("tutor", prompts), language: "ru", goal: "Pass the biology exam" }

    expect(presetOf(config, prompts)).toBe("tutor")
  })

  it("compares the custom text without surrounding spaces", () => {
    const config = { ...presetPatch("exam", prompts), custom_prompt: `  ${prompts.exam}\n` }

    expect(presetOf(config, prompts)).toBe("exam")
  })

  it("ignores a custom text that the style does not use", () => {
    expect(presetOf({ style: "default", custom_prompt: "left over", length: "default" }, prompts)).toBe("balanced")
    expect(presetOf({ style: "learning_guide", custom_prompt: "  ", length: "default" }, prompts)).toBe("tutor")
  })

  it("is null once the custom text was edited", () => {
    const edited = { ...presetPatch("simple", prompts), custom_prompt: `${prompts.simple} Use pictures.` }

    expect(presetOf(edited, prompts)).toBeNull()
  })

  it("is null once the length or the style differ", () => {
    expect(presetOf({ ...presetPatch("balanced", prompts), length: "longer" }, prompts)).toBeNull()
    expect(presetOf({ ...presetPatch("depth", prompts), length: "default" }, prompts)).toBeNull()
    expect(presetOf({ style: "custom", custom_prompt: null, length: "default" }, prompts)).toBeNull()
    expect(presetOf({ ...presetPatch("exam", prompts), style: "default", length: "shorter" }, prompts)).toBeNull()
  })

  it("matches the texts of the language in use only", () => {
    const russian: ChatPresetPrompts = { exam: "Отвечай как экзаменатор.", simple: "Простыми словами.", depth: "Подробно." }
    const fromRussian = presetPatch("exam", russian)

    expect(presetOf(fromRussian, russian)).toBe("exam")
    expect(presetOf(fromRussian, prompts)).toBeNull()
  })

  it("never matches two presets", () => {
    const ids: ChatPresetId[] = CHAT_PRESETS.map((preset) => preset.id)
    for (const id of ids) {
      const matches = CHAT_PRESETS.filter((preset) => presetOf(presetPatch(preset.id, prompts), prompts) === id)
      expect(matches.map((preset) => preset.id)).toEqual([id])
    }
  })
})
