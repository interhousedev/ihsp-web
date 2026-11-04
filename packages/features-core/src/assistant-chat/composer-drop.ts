/** The dropped files split by the composer's upload types (the `accept` list of the file input). */
export function splitDropped(files: readonly File[], accept: string): { accepted: File[]; rejected: File[] } {
  const extensions = new Set(
    accept
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter((item) => item.startsWith(".")),
  )
  const accepted: File[] = []
  const rejected: File[] = []
  for (const file of files) {
    const dot = file.name.lastIndexOf(".")
    const extension = dot > 0 ? file.name.slice(dot).toLowerCase() : ""
    if (extensions.has(extension)) accepted.push(file)
    else rejected.push(file)
  }
  return { accepted, rejected }
}
