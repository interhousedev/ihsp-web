import type { BadgeCondition, BadgeEvent, BadgeRule } from "@ihsp/api"

/**
 * The visual rule editor works on blocks, not on the rule JSON. A workspace is the WHEN hat (`event`) with a stack of IF
 * blocks under it; the stack is joined with AND. Every block keeps an `id` for React and drag and drop; `and`, `or` and
 * `not` hold their children in `children` (`not` holds at most one). The limits mirror the server
 * (`app/modules/lms/domain/badges.py`).
 */

export const MAX_DEPTH = 6
export const MAX_BLOCKS = 32
export const MIN_CHILDREN = 2
export const MAX_CHILDREN = 8

export const NUMBER_BOUNDS = {
  score_gte: [0, 100],
  count_gte: [1, 1000],
  within_days_of_enroll: [1, 365],
} as const

export type NumberOp = keyof typeof NUMBER_BOUNDS
export type GroupOp = "and" | "or" | "not"
export type BlockOp = GroupOp | NumberOp | "section_is" | "step_is"

export const GROUP_OPS: readonly GroupOp[] = ["and", "or", "not"]
export const CONDITION_OPS: readonly BlockOp[] = [
  "score_gte",
  "count_gte",
  "within_days_of_enroll",
  "section_is",
  "step_is",
]

export type Block = {
  id: string
  op: BlockOp
  /** Number blocks. */
  value: number
  /** `section_is`: the section id; `step_is`: the step id. Empty until chosen. */
  ref: string
  children: Block[]
}

export type Workspace = { event: BadgeEvent; stack: Block[] }

/** `null` is the stack under the WHEN hat. */
export type ParentId = string | null

export type RuleProblem =
  | { code: "tooManyBlocks"; blockId: null }
  | { code: "stackTooLong"; blockId: null }
  | { code: "tooDeep"; blockId: string }
  | { code: "childCount"; blockId: string }
  | { code: "notEmpty"; blockId: string }
  | { code: "numberRange"; blockId: string }
  | { code: "sectionMissing"; blockId: string }
  | { code: "stepMissing"; blockId: string }

let seq = 0
export function blockId(): string {
  seq += 1
  return `b${seq}`
}

export const isNumberOp = (op: BlockOp): op is NumberOp => op in NUMBER_BOUNDS
export const isGroupOp = (op: BlockOp): op is GroupOp => op === "and" || op === "or" || op === "not"

/** A fresh block from the palette; number blocks start at a sensible value. */
export function newBlock(op: BlockOp): Block {
  const value = op === "score_gte" ? 80 : op === "count_gte" ? 3 : op === "within_days_of_enroll" ? 7 : 0
  return { id: blockId(), op, value, ref: "", children: [] }
}

function fromCondition(cond: BadgeCondition): Block {
  const block: Block = { id: blockId(), op: cond.op, value: 0, ref: "", children: [] }
  switch (cond.op) {
    case "and":
    case "or":
      block.children = cond.children.map(fromCondition)
      break
    case "not":
      block.children = [fromCondition(cond.child)]
      break
    case "section_is":
      block.ref = cond.section_id
      break
    case "step_is":
      block.ref = cond.step_id
      break
    default:
      block.value = cond.value
  }
  return block
}

/** The rule as blocks: a top-level AND becomes the stack. */
export function ruleToWorkspace(rule: BadgeRule): Workspace {
  const cond = rule.condition
  if (cond === null) return { event: rule.event, stack: [] }
  if (cond.op === "and") return { event: rule.event, stack: cond.children.map(fromCondition) }
  return { event: rule.event, stack: [fromCondition(cond)] }
}

function toCondition(block: Block): BadgeCondition {
  switch (block.op) {
    case "and":
    case "or":
      return { op: block.op, children: block.children.map(toCondition) }
    case "not": {
      const child = block.children[0]
      if (!child) throw new Error("empty NOT block")
      return { op: "not", child: toCondition(child) }
    }
    case "section_is":
      return { op: "section_is", section_id: block.ref }
    case "step_is":
      return { op: "step_is", step_id: block.ref }
    default:
      return { op: block.op, value: block.value }
  }
}

/** The rule JSON of a workspace; call after `validateWorkspace` found no problems. */
export function workspaceToRule(ws: Workspace): BadgeRule {
  const [first, ...rest] = ws.stack
  if (!first) return { event: ws.event, condition: null }
  if (rest.length === 0) return { event: ws.event, condition: toCondition(first) }
  return { event: ws.event, condition: { op: "and", children: ws.stack.map(toCondition) } }
}

/** Every problem the server would reject, tied to the block that causes it. */
export function validateWorkspace(ws: Workspace): RuleProblem[] {
  const problems: RuleProblem[] = []
  const wrapped = ws.stack.length > 1
  let count = wrapped ? 1 : 0
  if (ws.stack.length > MAX_CHILDREN) problems.push({ code: "stackTooLong", blockId: null })
  const visit = (block: Block, depth: number) => {
    count += 1
    if (depth > MAX_DEPTH) problems.push({ code: "tooDeep", blockId: block.id })
    if (block.op === "and" || block.op === "or") {
      if (block.children.length < MIN_CHILDREN || block.children.length > MAX_CHILDREN)
        problems.push({ code: "childCount", blockId: block.id })
    } else if (block.op === "not") {
      if (block.children.length !== 1) problems.push({ code: "notEmpty", blockId: block.id })
    } else if (isNumberOp(block.op)) {
      const [low, high] = NUMBER_BOUNDS[block.op]
      if (!Number.isInteger(block.value) || block.value < low || block.value > high)
        problems.push({ code: "numberRange", blockId: block.id })
    } else if (block.op === "section_is" && !block.ref) {
      problems.push({ code: "sectionMissing", blockId: block.id })
    } else if (block.op === "step_is" && !block.ref) {
      problems.push({ code: "stepMissing", blockId: block.id })
    }
    for (const child of block.children) visit(child, depth + 1)
  }
  for (const block of ws.stack) visit(block, wrapped ? 2 : 1)
  if (count > MAX_BLOCKS) problems.unshift({ code: "tooManyBlocks", blockId: null })
  return problems
}

export function findBlock(blocks: readonly Block[], id: string): Block | null {
  for (const block of blocks) {
    if (block.id === id) return block
    const inner = findBlock(block.children, id)
    if (inner) return inner
  }
  return null
}

/** Where a block sits: its parent (`null` for the stack) and its index there. */
export function locate(
  blocks: readonly Block[],
  id: string,
  parent: ParentId = null,
): { parent: ParentId; index: number } | null {
  for (const [index, block] of blocks.entries()) {
    if (block.id === id) return { parent, index }
    const inner = locate(block.children, id, block.id)
    if (inner) return inner
  }
  return null
}

function mapChildren(blocks: Block[], parent: ParentId, fn: (children: Block[]) => Block[]): Block[] {
  if (parent === null) return fn(blocks)
  return blocks.map((block) =>
    block.id === parent
      ? { ...block, children: fn(block.children) }
      : { ...block, children: mapChildren(block.children, parent, fn) },
  )
}

/** Whether `parent` can take one more block: NOT holds one, AND/OR and the stack hold eight. */
export function hasRoom(ws: Workspace, parent: ParentId): boolean {
  if (parent === null) return ws.stack.length < MAX_CHILDREN
  const block = findBlock(ws.stack, parent)
  if (!block || !isGroupOp(block.op)) return false
  return block.children.length < (block.op === "not" ? 1 : MAX_CHILDREN)
}

export function insertBlock(ws: Workspace, parent: ParentId, index: number, block: Block): Workspace {
  if (!hasRoom(ws, parent)) return ws
  return {
    ...ws,
    stack: mapChildren(ws.stack, parent, (children) => {
      const next = [...children]
      next.splice(Math.max(0, Math.min(index, next.length)), 0, block)
      return next
    }),
  }
}

/** Removes a block with everything inside it. */
export function removeBlock(ws: Workspace, id: string): Workspace {
  const strip = (blocks: Block[]): Block[] =>
    blocks.filter((block) => block.id !== id).map((block) => ({ ...block, children: strip(block.children) }))
  return { ...ws, stack: strip(ws.stack) }
}

export function updateBlock(ws: Workspace, id: string, patch: Partial<Pick<Block, "value" | "ref">>): Workspace {
  const walk = (blocks: Block[]): Block[] =>
    blocks.map((block) => (block.id === id ? { ...block, ...patch } : { ...block, children: walk(block.children) }))
  return { ...ws, stack: walk(ws.stack) }
}

/** Whether `id` is `ancestor` or sits inside it. */
export function isInside(ws: Workspace, id: string, ancestor: string): boolean {
  const root = findBlock(ws.stack, ancestor)
  return root !== null && findBlock([root], id) !== null
}

/**
 * Moves a block (with its children) to `index` of `parent`. The index counts in the target as it is before the move,
 * as drop slots show it. A move into the block itself or a full container changes nothing.
 */
export function moveBlock(ws: Workspace, id: string, parent: ParentId, index: number): Workspace {
  const block = findBlock(ws.stack, id)
  const from = locate(ws.stack, id)
  if (!block || !from) return ws
  if (parent !== null && isInside(ws, parent, id)) return ws
  const sameParent = from.parent === parent
  if (!sameParent && !hasRoom(ws, parent)) return ws
  const target = sameParent && from.index < index ? index - 1 : index
  return insertBlock(removeBlock(ws, id), parent, target, block)
}

/** The containers a block can move to with the keyboard: the stack and every group with room, outside the block. */
export function moveTargets(ws: Workspace, id: string): { parent: ParentId; block: Block | null }[] {
  const from = locate(ws.stack, id)
  const targets: { parent: ParentId; block: Block | null }[] = []
  if (from?.parent === null || hasRoom(ws, null)) targets.push({ parent: null, block: null })
  const walk = (blocks: Block[]) => {
    for (const block of blocks) {
      if (block.id === id) continue
      if (isGroupOp(block.op) && (from?.parent === block.id || hasRoom(ws, block.id))) {
        targets.push({ parent: block.id, block })
      }
      walk(block.children)
    }
  }
  walk(ws.stack)
  return targets
}

export function countBlocks(blocks: readonly Block[]): number {
  return blocks.reduce((sum, block) => sum + 1 + countBlocks(block.children), 0)
}
