import { describe, expect, it } from "bun:test"
import { artifactFlashcards, artifactInfographic, artifactQuiz, artifactReport } from "@ihsp/test-utils"
import { optionLines } from "./option-lines"

describe("optionLines", () => {
  it("lists the options of a conspect and Auto language", () => {
    expect(optionLines(artifactReport)).toEqual([
      { labelKey: "opt.detail.label", valueKeys: ["opt.detail.standard"] },
      { labelKey: "opt.style.label", valueKeys: ["opt.style.outline"] },
      { labelKey: "opt.language", valueKeys: ["opt.languageAuto"] },
    ])
  })

  it("lists every quiz type and the explicit language", () => {
    const lines = optionLines({
      ...artifactQuiz,
      options: { ...artifactQuiz.options, language: "ru" },
    })
    expect(lines).toContainEqual({
      labelKey: "opt.types.label",
      valueKeys: ["opt.types.single", "opt.types.multiple", "opt.types.true_false"],
    })
    expect(lines.at(-1)).toEqual({
      labelKey: "opt.language",
      valueKeys: ["opt.lang.ru"],
    })
  })

  it("covers flash cards and infographics", () => {
    expect(optionLines(artifactFlashcards).slice(0, 2)).toEqual([
      { labelKey: "opt.count.label", valueKeys: ["opt.count.standard"] },
      {
        labelKey: "opt.difficulty.label",
        valueKeys: ["opt.difficulty.medium"],
      },
    ])
    expect(optionLines(artifactInfographic).map((entry) => entry.valueKeys?.[0])).toEqual([
      "opt.orientation.portrait",
      "opt.infoDetail.standard",
      "opt.infoStyle.clean",
      "opt.languageAuto",
    ])
  })
})
