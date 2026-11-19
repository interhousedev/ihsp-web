/** Labels joined the way the locale writes a list ("A, B and C"); the case of each label is kept. */
export function listLabels(labels: readonly string[], locale: string): string {
  return new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(labels)
}
