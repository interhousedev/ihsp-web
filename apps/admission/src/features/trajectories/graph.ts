import type { EdgeIo, NodeIn, StageIn, Trajectory, TrajectoryIn } from "./api"

/** Editor state of a saved trajectory: drops positions and computed resource URLs. */
export function toInput(t: Trajectory): TrajectoryIn {
  return {
    slug: t.slug,
    field: t.field,
    title: t.title,
    description: t.description,
    published: t.published,
    stages: t.stages.map((s) => ({
      id: s.id,
      title: s.title,
      nodes: s.nodes.map(({ position: _p, resources, ...n }) => ({
        ...n,
        resources: resources.map(({ kind, ref, title }) => ({ kind, ref, title })),
      })),
    })),
    edges: t.edges,
  }
}

/** Every node that depends on `id`, directly or not (choosing one of them as a prerequisite would close a cycle). */
export function dependentsOf(id: string, edges: readonly EdgeIo[]): Set<string> {
  const out = new Set<string>()
  const stack = [id]
  while (stack.length) {
    const cur = stack.pop() as string
    for (const e of edges) {
      if (e.before === cur && !out.has(e.after)) {
        out.add(e.after)
        stack.push(e.after)
      }
    }
  }
  return out
}

/** A fresh internal key (`n7`, `s3`) that no existing item uses; users never see it. */
export function freshKey(prefix: string, used: Iterable<string>): string {
  const taken = new Set(used)
  let i = 1
  while (taken.has(`${prefix}${i}`)) i += 1
  return `${prefix}${i}`
}

/** A kebab-case address from an English title. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

/** Removes a node with every edge that touches it. */
export function withoutNode(t: TrajectoryIn, id: string): TrajectoryIn {
  return {
    ...t,
    stages: t.stages.map((s) => ({ ...s, nodes: s.nodes.filter((n) => n.id !== id) })),
    edges: t.edges.filter((e) => e.before !== id && e.after !== id),
  }
}

/** Sets the prerequisites of `id` to `before`. */
export function withPrerequisites(t: TrajectoryIn, id: string, before: readonly string[]): TrajectoryIn {
  return {
    ...t,
    edges: [...t.edges.filter((e) => e.after !== id), ...before.map((b) => ({ before: b, after: id }))],
  }
}

/** Moves a node within its stage (`dy`) or to a neighbouring stage (`dx`). */
export function moveNode(t: TrajectoryIn, id: string, dx: number, dy: number): TrajectoryIn {
  const si = t.stages.findIndex((s) => s.nodes.some((n) => n.id === id))
  if (si < 0) return t
  const stages = t.stages.map((s) => ({ ...s, nodes: [...s.nodes] }))
  const from = stages[si] as StageIn
  const ni = from.nodes.findIndex((n) => n.id === id)
  const node = from.nodes[ni] as NodeIn
  if (dx !== 0) {
    const to = stages[si + dx]
    if (!to) return t
    from.nodes.splice(ni, 1)
    to.nodes.push(node)
  } else {
    const j = ni + dy
    if (j < 0 || j >= from.nodes.length) return t
    from.nodes.splice(ni, 1)
    from.nodes.splice(j, 0, node)
  }
  return { ...t, stages }
}

/** Swaps a stage with its neighbour. */
export function moveStage(t: TrajectoryIn, index: number, d: number): TrajectoryIn {
  const j = index + d
  if (j < 0 || j >= t.stages.length) return t
  const stages = [...t.stages]
  ;[stages[index], stages[j]] = [stages[j] as StageIn, stages[index] as StageIn]
  return { ...t, stages }
}
