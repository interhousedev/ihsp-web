/** A known topic tag in the UI language, otherwise the tag humanized. */
type TopicTranslator = { (key: string): string; has: (key: string) => boolean }

function topicLabel(t: TopicTranslator, tag: string): string {
  const key = tag.toLowerCase().replace(/[^a-z0-9]+/g, "_")
  if (t.has(`topics.${key}`)) return t(`topics.${key}`)
  const text = tag.replace(/[_-]+/g, " ")
  return text.charAt(0).toUpperCase() + text.slice(1)
}

              {value === null ? t("allTags") : topicLabel(t, value)}