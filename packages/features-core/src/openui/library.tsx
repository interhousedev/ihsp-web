"use client"

import {
  Card as UiCard,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress as UiProgress,
  ProgressLabel,
  Table as UiTable,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  buttonVariants,
  cn,
} from "@ihsp/ui"
import { createLibrary, defineComponent, type ComponentRenderProps } from "@openuidev/react-lang"
import type { ReactNode } from "react"
import { z } from "zod"
import catalog from "./catalog.json"
import { SeriesChart } from "./charts"
import { FlowDiagram } from "./flow"
import { clamp, safeHttpsUrl, str } from "./safe"

const text = z.union([z.string(), z.number()])
const children = z.array(z.unknown())

function Nodes({ list, render }: { list: unknown[]; render: (value: unknown) => ReactNode }) {
  return (
    <>
      {clamp(list, catalog.limits.max_list_items).map((child, index) => (
        <div key={index} className="min-w-0">
          {render(child)}
        </div>
      ))}
    </>
  )
}

const Stack = defineComponent({
  name: "Stack",
  description: "Vertical layout of other components. The usual root.",
  props: z.object({ children }),
  component: ({ props, renderNode }: ComponentRenderProps<{ children: unknown[] }>) => (
    <div className="my-2 flex min-w-0 flex-col gap-3">
      <Nodes list={props.children} render={renderNode} />
    </div>
  ),
})

const Card = defineComponent({
  name: "Card",
  description: "A titled card that groups a few components.",
  props: z.object({ title: z.string(), children, subtitle: z.string().optional() }),
  component: ({
    props,
    renderNode,
  }: ComponentRenderProps<{ title: string; children: unknown[]; subtitle?: string }>) => (
    <UiCard className="min-w-0">
      <CardHeader>
        <CardTitle className="text-base break-words">{str(props.title)}</CardTitle>
        {props.subtitle ? <CardDescription className="break-words">{str(props.subtitle)}</CardDescription> : null}
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-3">
        <Nodes list={props.children} render={renderNode} />
      </CardContent>
    </UiCard>
  ),
})

const TONES = { body: "text-sm", muted: "text-muted-foreground text-sm", heading: "text-base font-semibold" }

const TextBlock = defineComponent({
  name: "TextBlock",
  description: "A short paragraph of plain text inside a card or stack.",
  props: z.object({ text: z.string(), tone: z.enum(["body", "muted", "heading"]).optional() }),
  component: ({ props }: ComponentRenderProps<{ text: string; tone?: keyof typeof TONES }>) => (
    <p className={cn("break-words", TONES[props.tone ?? "body"] ?? TONES.body)}>{str(props.text)}</p>
  ),
})

type StatItem = { label: string; value: string | number; hint?: string }

const StatGrid = defineComponent({
  name: "StatGrid",
  description: "A grid of key numbers (averages, counts, totals).",
  props: z.object({
    items: z.array(z.object({ label: z.string(), value: text, hint: z.string().optional() })),
  }),
  component: ({ props }: ComponentRenderProps<{ items: StatItem[] }>) => (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {clamp(props.items, 8).map((item, index) => (
        <UiCard key={index} size="sm" className="min-w-0">
          <CardContent className="flex min-w-0 flex-col">
            <dt className="text-muted-foreground text-xs break-words">{str(item.label)}</dt>
            <dd className="text-xl font-semibold break-words">{str(item.value)}</dd>
            {item.hint ? <dd className="text-muted-foreground text-xs break-words">{str(item.hint)}</dd> : null}
          </CardContent>
        </UiCard>
      ))}
    </dl>
  ),
})

const Table = defineComponent({
  name: "Table",
  description: "A table: column headers and rows of cells (strings or numbers).",
  props: z.object({
    columns: z.array(z.string()),
    rows: z.array(z.array(text)),
    caption: z.string().optional(),
  }),
  component: ({
    props,
  }: ComponentRenderProps<{ columns: string[]; rows: (string | number)[][]; caption?: string }>) => {
    const columns = clamp(props.columns, 8)
    const rows = clamp(props.rows, 40).map((row) => clamp(row, 8))
    return (
      <div data-slot="openui-table" className="flex min-w-0 flex-col gap-2">
        {props.caption ? <p className="text-muted-foreground text-xs break-words">{str(props.caption)}</p> : null}
        <div className="hidden min-w-0 rounded-lg border md:block">
          <UiTable>
            <TableCaption className="sr-only">{str(props.caption)}</TableCaption>
            <TableHeader>
              <TableRow>
                {columns.map((column, index) => (
                  <TableHead key={index} className="whitespace-nowrap">
                    {str(column)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <TableCell key={cellIndex} className="align-top break-words whitespace-normal">
                      {str(cell)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </UiTable>
        </div>
        <ul data-slot="openui-table-cards" className="flex min-w-0 flex-col gap-2 md:hidden">
          {rows.map((row, rowIndex) => (
            <li key={rowIndex} className="min-w-0">
              <UiCard size="sm" className="min-w-0">
                <CardContent>
                  <dl className="flex flex-col gap-1">
                    {row.map((cell, cellIndex) => (
                      <div key={cellIndex} className="flex min-w-0 flex-wrap gap-x-2 text-sm">
                        <dt className="text-muted-foreground">{str(columns[cellIndex])}:</dt>
                        <dd className="min-w-0 break-words">{str(cell)}</dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </UiCard>
            </li>
          ))}
        </ul>
      </div>
    )
  },
})

type SeriesBlockProps = { labels: string[]; values: number[]; title?: string; unit?: string }

const BarChart = defineComponent({
  name: "BarChart",
  description: "A bar chart of one series: category labels and their numbers.",
  props: z.object({
    labels: z.array(z.string()),
    values: z.array(z.number()),
    title: z.string().optional(),
    unit: z.string().optional(),
  }),
  component: ({ props }: ComponentRenderProps<SeriesBlockProps>) => <SeriesChart {...props} max={24} kind="bar" />,
})

const LineChart = defineComponent({
  name: "LineChart",
  description: "A line chart of one series over time: x labels and their numbers (progress, trends).",
  props: z.object({
    labels: z.array(z.string()),
    values: z.array(z.number()),
    title: z.string().optional(),
    unit: z.string().optional(),
  }),
  component: ({ props }: ComponentRenderProps<SeriesBlockProps>) => <SeriesChart {...props} max={40} kind="line" />,
})

const Progress = defineComponent({
  name: "Progress",
  description: "A progress bar: a label, the value and the maximum.",
  props: z.object({ label: z.string(), value: z.number(), max: z.number() }),
  component: ({ props }: ComponentRenderProps<{ label: string; value: number; max: number }>) => {
    const max = props.max > 0 ? props.max : 1
    const percent = Math.round(Math.min(100, Math.max(0, (props.value / max) * 100)))
    return (
      <UiProgress value={percent} className="min-w-0 flex-col gap-1">
        <div className="flex justify-between gap-2">
          <ProgressLabel className="break-words">{str(props.label)}</ProgressLabel>
          <span className="text-muted-foreground shrink-0 text-sm">
            {props.value} / {props.max}
          </span>
        </div>
      </UiProgress>
    )
  },
})

type Entry = { day: string; time: string; title: string; place?: string }

const Timetable = defineComponent({
  name: "Timetable",
  description: "A day or week schedule: one entry per lesson or event.",
  props: z.object({
    entries: z.array(z.object({ day: z.string(), time: z.string(), title: z.string(), place: z.string().optional() })),
    title: z.string().optional(),
  }),
  component: ({ props }: ComponentRenderProps<{ entries: Entry[]; title?: string }>) => (
    <div className="flex min-w-0 flex-col gap-2">
      {props.title ? <p className="text-sm font-medium">{str(props.title)}</p> : null}
      <ul className="flex min-w-0 flex-col gap-2">
        {clamp(props.entries, 40).map((entry, index) => (
          <li key={index} className="min-w-0">
            <UiCard size="sm" className="min-w-0">
              <CardContent className="flex min-w-0 flex-col gap-0.5 text-sm">
                <span className="text-muted-foreground text-xs break-words">
                  {str(entry.day)} {str(entry.time)}
                </span>
                <span className="font-medium break-words">{str(entry.title)}</span>
                {entry.place ? (
                  <span className="text-muted-foreground text-xs break-words">{str(entry.place)}</span>
                ) : null}
              </CardContent>
            </UiCard>
          </li>
        ))}
      </ul>
    </div>
  ),
})

type LinkItem = { title: string; url: string; description?: string }

const LinkList = defineComponent({
  name: "LinkList",
  description: "A list of https links with short descriptions.",
  props: z.object({
    links: z.array(z.object({ title: z.string(), url: z.string(), description: z.string().optional() })),
    title: z.string().optional(),
  }),
  component: ({ props }: ComponentRenderProps<{ links: LinkItem[]; title?: string }>) => (
    <div className="flex min-w-0 flex-col gap-2">
      {props.title ? <p className="text-sm font-medium">{str(props.title)}</p> : null}
      <ul className="flex flex-col gap-2">
        {clamp(props.links, 12).map((link, index) => {
          const href = safeHttpsUrl(link.url)
          return (
            <li key={index} className="flex min-w-0 flex-col text-sm">
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className={cn(
                    buttonVariants({ variant: "link" }),
                    "h-auto min-h-11 justify-start px-0 text-start break-words whitespace-normal [overflow-wrap:anywhere]",
                  )}
                >
                  {str(link.title)}
                </a>
              ) : (
                <span className="break-words">{str(link.title)}</span>
              )}
              {link.description ? <span className="text-muted-foreground text-xs">{str(link.description)}</span> : null}
            </li>
          )
        })}
      </ul>
    </div>
  ),
})

const Flow = defineComponent({
  name: "Flow",
  description: "A simple diagram: steps in order, drawn as boxes joined by arrows.",
  props: z.object({ steps: z.array(z.string()), title: z.string().optional() }),
  component: ({ props }: ComponentRenderProps<{ steps: string[]; title?: string }>) => (
    <FlowDiagram steps={props.steps} title={props.title} />
  ),
})

const ALL = [Stack, Card, TextBlock, StatGrid, Table, BarChart, LineChart, Progress, Timetable, LinkList, Flow]
const STUDIO_NAMES = new Set(catalog.components.filter((c) => c.subsets.includes("studio")).map((c) => c.name))

export const chatLibrary = createLibrary({ components: ALL, root: catalog.root })
export const studioLibrary = createLibrary({
  components: ALL.filter((component) => STUDIO_NAMES.has(component.name)),
  root: catalog.root,
})
