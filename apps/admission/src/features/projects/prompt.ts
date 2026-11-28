import type { Project } from "./api"

/**
 * The text copied to brainstorm one project in any chatbot. It is built only from the project's own fields:
 * never from the brief, the profile or any admission data.
 */
export function buildProjectPrompt(project: Project): string {
  const lines = [`Project idea: ${project.title}`, "", project.summary]
  if (project.deliverable) lines.push("", `Result: ${project.deliverable}`)
  if (project.measure) lines.push(`Measure of success: ${project.measure}`)
  if (project.analogs.length > 0) {
    lines.push("", "Similar projects:")
    for (const a of project.analogs) lines.push(`- ${a.name}${a.url ? ` (${a.url})` : ""}`)
  }
  if (project.challenges.length > 0) {
    lines.push("", "Challenges:")
    for (const c of project.challenges) lines.push(`- ${c}`)
  }
  if (project.first_steps.length > 0) {
    lines.push("", "First steps:")
    project.first_steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`))
  }
  lines.push(
    "",
    "Brainstorm this project further with me: suggest sharper variations, a realistic scope for a high-school student, " +
      "what to build first, how to measure success and which risks to check early. Ask me questions where it helps.",
  )
  return lines.join("\n")
}
