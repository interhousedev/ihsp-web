import { describe, expect, it } from "bun:test"
import type { LabelItem, SourceItem } from "@ihsp/api"
import { labelCalvin, labelPhotosynthesis, notebookSources } from "@ihsp/test-utils"
import { groupByTopic } from "./topic-groups"

const [file, lesson, text] = notebookSources as [SourceItem, SourceItem, SourceItem]
const withLabels = (source: SourceItem, ...ids: string[]): SourceItem => ({ ...source, label_ids: ids })

describe("groupByTopic", () => {
  it("groups by label in label order and lists a source under each of its labels", () => {
    const sources = [
      withLabels(file, labelCalvin.id, labelPhotosynthesis.id),
      withLabels(lesson, labelPhotosynthesis.id),
      text,
    ]

    const groups = groupByTopic(sources, [labelCalvin, labelPhotosynthesis], false)

    expect(groups.map((g) => [g.label?.name ?? null, g.sources.map((s) => s.title)])).toEqual([
      ["Photosynthesis", ["Biology 10.pdf", "Lesson 5: Photosynthesis"]],
      ["Calvin cycle", ["Biology 10.pdf"]],
      [null, ["My notes"]],
    ])
  })

  it("puts the sources of a deleted label with the unlabelled ones", () => {
    const groups = groupByTopic([withLabels(file, "gone")], [labelPhotosynthesis], false)

    expect(groups).toHaveLength(1)
    expect(groups[0]?.label).toBeNull()
  })

  it("keeps an empty topic only when asked to, so it can still be renamed or deleted", () => {
    const empty: LabelItem = { ...labelCalvin, id: "empty", position: 9 }

    expect(groupByTopic([withLabels(file, labelPhotosynthesis.id)], [labelPhotosynthesis, empty], true)).toHaveLength(2)
    expect(groupByTopic([withLabels(file, labelPhotosynthesis.id)], [labelPhotosynthesis, empty], false)).toHaveLength(
      1,
    )
  })

  it("orders the sources of a topic by position", () => {
    const later = { ...withLabels(file, labelCalvin.id), position: 7 }
    const earlier = { ...withLabels(lesson, labelCalvin.id), position: 2 }

    const [group] = groupByTopic([later, earlier], [labelCalvin], false)

    expect(group?.sources.map((s) => s.position)).toEqual([2, 7])
  })
})
