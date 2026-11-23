"use client"

import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { BADGE_EVENTS, type BadgeEvent, type OutlineSection } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Icons,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@ihsp/ui"
import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import {
  CONDITION_OPS,
  GROUP_OPS,
  NUMBER_BOUNDS,
  findBlock,
  hasRoom,
  insertBlock,
  isInside,
  isNumberOp,
  locate,
  moveBlock,
  moveTargets,
  newBlock,
  removeBlock,
  updateBlock,
  type Block,
  type BlockOp,
  type ParentId,
  type RuleProblem,
  type Workspace,
} from "../utils/rule-blocks"

/** Scratch-like block colours: events yellow, control orange, operators green, sensing blue, outline purple. */
const COLORS: Record<BlockOp | "if", string> = {
  if: "bg-[#FFAB19] border-[#CF8B17]",
  and: "bg-[#59C059] border-[#389438]",
  or: "bg-[#59C059] border-[#389438]",
  not: "bg-[#389438] border-[#2a702a]",
  score_gte: "bg-[#4C97FF] border-[#3373CC]",
  count_gte: "bg-[#4C97FF] border-[#3373CC]",
  within_days_of_enroll: "bg-[#4C97FF] border-[#3373CC]",
  section_is: "bg-[#9966FF] border-[#774DCB]",
  step_is: "bg-[#9966FF] border-[#774DCB]",
}

const ROOT = "root"
const slotId = (parent: ParentId, index: number) => `slot|${parent ?? ROOT}|${index}`

type Ctx = {
  ws: Workspace
  set: (next: Workspace) => void
  outline: OutlineSection[]
  problems: RuleProblem[]
  dragging: { kind: "palette"; op: BlockOp } | { kind: "block"; id: string; parent: ParentId } | null
  targetLabel: (parent: ParentId) => string
}
const BuilderContext = createContext<Ctx | null>(null)
function useBuilder(): Ctx {
  const ctx = useContext(BuilderContext)
  if (!ctx) throw new Error("RuleBuilder context missing")
  return ctx
}

/** The visual rule editor: a WHEN hat, a stack of IF blocks, AND/OR/NOT C-blocks and condition blocks. */
export function RuleBuilder({
  value,
  onChange,
  outline,
  problems,
}: {
  value: Workspace
  onChange: (next: Workspace) => void
  outline: OutlineSection[]
  problems: RuleProblem[]
}) {
  const t = useT("badges")
  const [dragging, setDragging] = useState<Ctx["dragging"]>(null)
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
  )
  // Groups are numbered in reading order, so the keyboard "Move into" menu can name them.
  const targetLabel = useMemo(() => {
    const numbers = new Map<string, number>()
    const walk = (blocks: Block[]) => {
      for (const block of blocks) {
        if (block.op === "and" || block.op === "or" || block.op === "not") numbers.set(block.id, numbers.size + 1)
        walk(block.children)
      }
    }
    walk(value.stack)
    return (parent: ParentId) => {
      if (parent === null) return t("rule.underWhen")
      const block = findBlock(value.stack, parent)?.op
      return t("rule.insideGroup", { name: t(`blocks.${block ?? "and"}.palette`), n: numbers.get(parent) ?? 0 })
    }
  }, [value.stack, t])

  function onDragStart({ active }: DragStartEvent) {
    const id = String(active.id)
    if (id.startsWith("palette|")) setDragging({ kind: "palette", op: id.slice(8) as BlockOp })
    else {
      const blockId = id.slice(6)
      setDragging({ kind: "block", id: blockId, parent: locate(value.stack, blockId)?.parent ?? null })
    }
  }
  function onDragEnd({ active, over }: DragEndEvent) {
    setDragging(null)
    if (!over) return
    const [, rawParent, rawIndex] = String(over.id).split("|")
    const parent = rawParent === ROOT ? null : (rawParent ?? null)
    const index = Number(rawIndex)
    const id = String(active.id)
    if (id.startsWith("palette|")) onChange(insertBlock(value, parent, index, newBlock(id.slice(8) as BlockOp)))
    else onChange(moveBlock(value, id.slice(6), parent, index))
  }

  const ctx: Ctx = { ws: value, set: onChange, outline, problems, dragging, targetLabel }
  return (
    <BuilderContext.Provider value={ctx}>
      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setDragging(null)}
      >
        <div className="grid gap-4 lg:grid-cols-[13rem_minmax(0,1fr)]">
          <Palette />
          <section
            aria-label={t("rule.canvas")}
            className="bg-muted/40 rounded-card min-w-0 overflow-x-auto border p-3 [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:16px_16px] md:p-4"
          >
            <HatBlock />
            <ChildList parent={null} blocks={value.stack} top />
          </section>
        </div>
        <DragOverlay dropAnimation={null}>
          {dragging ? (
            <div
              className={cn(
                "rounded-lg border-b-4 px-3 py-2 text-sm font-semibold text-white shadow-lg",
                COLORS[overlayOp(dragging, value)],
              )}
            >
              {t(`blocks.${overlayOp(dragging, value)}.palette`)}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </BuilderContext.Provider>
  )
}

function overlayOp(dragging: NonNullable<Ctx["dragging"]>, ws: Workspace): BlockOp {
  return dragging.kind === "palette" ? dragging.op : (findBlock(ws.stack, dragging.id)?.op ?? "and")
}

function Palette() {
  const t = useT("badges")
  return (
    <aside aria-label={t("rule.palette")} className="flex flex-col gap-3">
      <p className="text-muted-foreground text-xs">{t("rule.paletteHint")}</p>
      <div className="flex flex-wrap gap-2 lg:flex-col">
        {[...GROUP_OPS, ...CONDITION_OPS].map((op) => (
          <PaletteItem key={op} op={op} />
        ))}
      </div>
    </aside>
  )
}

function PaletteItem({ op }: { op: BlockOp }) {
  const t = useT("badges")
  const { ws, set, targetLabel } = useBuilder()
  const { setNodeRef, listeners, isDragging } = useDraggable({ id: `palette|${op}` })
  const targets = [null, ...collectGroups(ws.stack)].filter((parent) => hasRoom(ws, parent))
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            ref={setNodeRef}
            {...listeners}
            type="button"
            data-testid={`palette-${op}`}
            aria-label={t("rule.addBlock", { name: t(`blocks.${op}.palette`) })}
            className={cn(
              "flex min-h-11 touch-manipulation items-center gap-2 rounded-lg border-b-4 px-3 text-start text-sm font-semibold text-white shadow-sm md:min-h-9",
              "focus-visible:ring-ring cursor-grab focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
              COLORS[op],
              isDragging && "opacity-50",
            )}
          />
        }
      >
        <Icons.add aria-hidden className="size-4" />
        {t(`blocks.${op}.palette`)}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("rule.addTo")}</DropdownMenuLabel>
          {targets.length === 0 ? (
            <DropdownMenuItem disabled>{t("rule.noRoom")}</DropdownMenuItem>
          ) : (
            targets.map((parent) => (
              <DropdownMenuItem
                key={parent ?? ROOT}
                className="min-h-11 md:min-h-8"
                onClick={() => set(insertBlock(ws, parent, Number.MAX_SAFE_INTEGER, newBlock(op)))}
              >
                {targetLabel(parent)}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function collectGroups(blocks: Block[]): string[] {
  return blocks.flatMap((block) => [
    ...(block.op === "and" || block.op === "or" || block.op === "not" ? [block.id] : []),
    ...collectGroups(block.children),
  ])
}

function HatBlock() {
  const t = useT("badges")
  const { ws, set } = useBuilder()
  return (
    <div
      data-testid="when-block"
      className="relative flex w-fit max-w-full flex-wrap items-center gap-2 rounded-t-[1.5rem] rounded-b-lg border-b-4 border-[#CC9900] bg-[#FFBF00] px-4 pt-4 pb-2 text-sm font-bold text-black/80 shadow-sm"
    >
      <span>{t("rule.when")}</span>
      <Select
        value={ws.event}
        items={BADGE_EVENTS.map((event) => ({ value: event, label: t(`events.${event}`) }))}
        onValueChange={(next) => next && set({ ...ws, event: next as BadgeEvent })}
      >
        <SelectTrigger aria-label={t("rule.event")} className="min-h-10 rounded-full bg-white text-black md:min-h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {BADGE_EVENTS.map((event) => (
            <SelectItem key={event} value={event}>
              {t(`events.${event}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Notch className="-bottom-[10px] border-[#CC9900] bg-[#FFBF00]" />
    </div>
  )
}

/** The tab under a block that the next block snaps to. */
function Notch({ className }: { className?: string }) {
  return <span aria-hidden className={cn("absolute start-5 z-10 h-[10px] w-6 rounded-b-md border-b-4", className)} />
}

function ChildList({ parent, blocks, top = false }: { parent: ParentId; blocks: Block[]; top?: boolean }) {
  const t = useT("badges")
  return (
    <ol className="flex min-w-0 flex-col" aria-label={top ? t("rule.stack") : undefined}>
      <Slot parent={parent} index={0} empty={blocks.length === 0} />
      {blocks.map((block, index) => (
        <li key={block.id} className="min-w-0">
          {top ? (
            <IfWrapper first={index === 0}>
              <BlockView block={block} />
            </IfWrapper>
          ) : (
            <BlockView block={block} />
          )}
          <Slot parent={parent} index={index + 1} />
        </li>
      ))}
    </ol>
  )
}

/** A top-level IF block: the stack under WHEN; blocks after the first join with AND. */
function IfWrapper({ first, children }: { first: boolean; children: ReactNode }) {
  const t = useT("badges")
  return (
    <div
      className={cn("relative flex w-fit max-w-full min-w-0 items-stretch rounded-lg border-b-4 shadow-sm", COLORS.if)}
    >
      <span className="flex shrink-0 items-start px-3 pt-3 text-sm font-bold text-white">
        {first ? t("rule.if") : t("rule.andIf")}
      </span>
      <div className="min-w-0 py-1.5 pe-1.5">{children}</div>
      <Notch className={cn("-bottom-[10px]", COLORS.if)} />
    </div>
  )
}

function Slot({ parent, index, empty = false }: { parent: ParentId; index: number; empty?: boolean }) {
  const t = useT("badges")
  const { ws, dragging } = useBuilder()
  const movingHere = dragging?.kind === "block" && dragging.parent === parent
  const blockedInside = dragging?.kind === "block" && parent !== null && isInside(ws, parent, dragging.id)
  const accepts = dragging !== null && !blockedInside && (movingHere || hasRoom(ws, parent))
  const { setNodeRef, isOver } = useDroppable({ id: slotId(parent, index), disabled: !accepts })
  if (empty) {
    return (
      <div
        ref={setNodeRef}
        data-testid={`empty-slot-${parent ?? ROOT}`}
        className={cn(
          "text-muted-foreground my-1 flex min-h-11 items-center rounded-lg border-2 border-dashed px-3 text-xs",
          accepts && "border-primary/60",
          isOver && accepts && "bg-primary/10 border-primary",
        )}
      >
        {parent === null ? t("rule.emptyStack") : t("rule.emptyGroup")}
      </div>
    )
  }
  return (
    <div
      ref={setNodeRef}
      aria-hidden
      className={cn("rounded transition-all", accepts ? "my-0.5 h-3" : "h-1.5", isOver && accepts && "bg-primary h-2")}
    />
  )
}

function useProblems(blockId: string): string[] {
  const t = useT("badges")
  const { problems } = useBuilder()
  return problems.filter((p) => p.blockId === blockId).map((p) => t(`problems.${p.code}`))
}

function BlockView({ block }: { block: Block }) {
  const t = useT("badges")
  const { setNodeRef, listeners, isDragging } = useDraggable({ id: `block|${block.id}` })
  const messages = useProblems(block.id)
  const isGroup = block.op === "and" || block.op === "or" || block.op === "not"
  const handle = (
    <span
      {...listeners}
      aria-hidden
      className="flex min-h-10 cursor-grab touch-none items-center gap-1 text-sm font-bold text-white select-none md:min-h-8"
    >
      <Icons.gripVertical className="size-4 opacity-70" />
      {t(`blocks.${block.op}.before`)}
    </span>
  )
  return (
    <div
      ref={setNodeRef}
      role="group"
      aria-label={t(`blocks.${block.op}.palette`)}
      data-testid={`block-${block.op}`}
      className={cn("w-fit max-w-full min-w-0", isDragging && "opacity-40")}
    >
      {isGroup ? (
        <div
          className={cn(
            "rounded-lg border-b-4 shadow-sm",
            COLORS[block.op],
            messages.length && "ring-destructive ring-2 ring-offset-1",
          )}
        >
          <div className="flex flex-wrap items-center gap-2 px-2 py-1">
            {handle}
            <BlockMenu block={block} />
          </div>
          <div className="bg-background/90 ms-3 me-0 min-h-11 min-w-32 rounded-s-md p-1.5 md:ms-4">
            <ChildList parent={block.id} blocks={block.children} />
          </div>
          <div className="h-3" />
        </div>
      ) : (
        <div
          className={cn(
            "flex flex-wrap items-center gap-2 rounded-full border-b-4 px-3 py-1 shadow-sm",
            COLORS[block.op],
            messages.length && "ring-destructive ring-2 ring-offset-1",
          )}
        >
          {handle}
          <LeafInput block={block} />
          {t(`blocks.${block.op}.after`) ? (
            <span className="text-sm font-bold text-white">{t(`blocks.${block.op}.after`)}</span>
          ) : null}
          <BlockMenu block={block} />
        </div>
      )}
      {messages.map((message) => (
        <p key={message} role="alert" className="text-destructive mt-1 text-xs font-medium">
          {message}
        </p>
      ))}
    </div>
  )
}

function LeafInput({ block }: { block: Block }) {
  const t = useT("badges")
  const { ws, set, outline } = useBuilder()
  if (isNumberOp(block.op)) {
    const [min, max] = NUMBER_BOUNDS[block.op]
    return (
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        value={Number.isNaN(block.value) ? "" : block.value}
        aria-label={t(`blocks.${block.op}.input`, { min, max })}
        onChange={(event) => set(updateBlock(ws, block.id, { value: event.target.valueAsNumber }))}
        className="focus-visible:ring-ring h-9 w-20 rounded-full bg-white px-3 text-center text-sm font-semibold text-black focus-visible:ring-2 focus-visible:outline-none md:h-7"
      />
    )
  }
  if (block.op === "section_is") {
    return (
      <Select
        value={block.ref || null}
        items={outline.map((section) => ({ value: section.id, label: section.title }))}
        onValueChange={(next) => next && set(updateBlock(ws, block.id, { ref: String(next) }))}
      >
        <SelectTrigger
          aria-label={t("blocks.section_is.input")}
          className="min-h-9 max-w-56 rounded-full bg-white text-black md:min-h-7"
        >
          <SelectValue placeholder={t("rule.chooseSection")} />
        </SelectTrigger>
        <SelectContent>
          {outline.map((section) => (
            <SelectItem key={section.id} value={section.id}>
              {section.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }
  if (block.op === "step_is") {
    return (
      <Select
        value={block.ref || null}
        items={outline.flatMap((section) => section.steps.map((step) => ({ value: step.step_id, label: step.title })))}
        onValueChange={(next) => next && set(updateBlock(ws, block.id, { ref: String(next) }))}
      >
        <SelectTrigger
          aria-label={t("blocks.step_is.input")}
          className="min-h-9 max-w-56 rounded-full bg-white text-black md:min-h-7"
        >
          <SelectValue placeholder={t("rule.chooseStep")} />
        </SelectTrigger>
        <SelectContent>
          {outline.map((section) => (
            <SelectGroup key={section.id}>
              <SelectLabel>{section.title}</SelectLabel>
              {section.steps.map((step) => (
                <SelectItem key={step.step_id} value={step.step_id}>
                  {step.title}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    )
  }
  return null
}

/** The keyboard alternative to dragging: move up or down, into another container, or delete. */
function BlockMenu({ block }: { block: Block }) {
  const t = useT("badges")
  const { ws, set, targetLabel } = useBuilder()
  const at = locate(ws.stack, block.id)
  if (!at) return null
  const siblings = at.parent === null ? ws.stack.length : (findBlock(ws.stack, at.parent)?.children.length ?? 0)
  const targets = moveTargets(ws, block.id).filter((target) => target.parent !== at.parent)
  const name = t(`blocks.${block.op}.palette`)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-9 rounded-full text-white hover:bg-white/20 hover:text-white md:size-7"
            aria-label={t("rule.blockActions", { name })}
            data-testid="block-menu"
          />
        }
      >
        <Icons.dots aria-hidden className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuItem
          className="min-h-11 md:min-h-8"
          disabled={at.index === 0}
          onClick={() => set(moveBlock(ws, block.id, at.parent, at.index - 1))}
        >
          {t("rule.moveUp")}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="min-h-11 md:min-h-8"
          disabled={at.index >= siblings - 1}
          onClick={() => set(moveBlock(ws, block.id, at.parent, at.index + 2))}
        >
          {t("rule.moveDown")}
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="min-h-11 md:min-h-8" disabled={targets.length === 0}>
            {t("rule.moveInto")}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-60">
            {targets.map((target) => (
              <DropdownMenuItem
                key={target.parent ?? ROOT}
                className="min-h-11 md:min-h-8"
                onClick={() => set(moveBlock(ws, block.id, target.parent, Number.MAX_SAFE_INTEGER))}
              >
                {targetLabel(target.parent)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive min-h-11 md:min-h-8"
          onClick={() => set(removeBlock(ws, block.id))}
        >
          {t("rule.delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
