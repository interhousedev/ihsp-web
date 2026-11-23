"use client"

import type { ExamCalculator } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Icons, Input } from "@ihsp/ui"
import { useEffect, useRef, useState } from "react"
import { compile, evaluate } from "../../utils/exam-math"
import { useEscapeKey } from "./use-escape-key"

const KEYS = [
  "sin(",
  "cos(",
  "tan(",
  "sqrt(",
  "ln(",
  "log(",
  "^",
  "π",
  "(",
  ")",
  "7",
  "8",
  "9",
  "/",
  "4",
  "5",
  "6",
  "*",
  "1",
  "2",
  "3",
  "-",
  "0",
  ".",
  "e",
  "+",
]
const COLORS = ["#2563eb", "#dc2626", "#16a34a"]

/** The exam calculator: a scientific keypad and, when allowed, a self-contained function grapher. */
export function ExamCalculatorPanel({ kind, onClose }: { kind: ExamCalculator; onClose: () => void }) {
  const t = useT("examPlayer")
  const [tab, setTab] = useState<"scientific" | "graphing">(kind === "graphing" ? "graphing" : "scientific")
  useEscapeKey(onClose)
  return (
    <section
      role="dialog"
      aria-label={t("calculator")}
      className="bg-background fixed right-2 top-16 z-[60] flex max-h-[80vh] w-[min(22rem,calc(100vw-1rem))] flex-col gap-2 overflow-auto rounded-lg border p-3 shadow-xl"
    >
      <div className="flex items-center justify-between gap-2">
        {kind === "graphing" ? (
          <div role="tablist" className="flex gap-1">
            {(["graphing", "scientific"] as const).map((item) => (
              <Button
                key={item}
                role="tab"
                aria-selected={tab === item}
                size="sm"
                variant={tab === item ? "default" : "ghost"}
                onClick={() => setTab(item)}
              >
                {t(`calc.${item}`)}
              </Button>
            ))}
          </div>
        ) : (
          <h2 className="text-sm font-semibold">{t("calculator")}</h2>
        )}
        <Button variant="ghost" size="icon" onClick={onClose} aria-label={t("close")} className="size-11 md:size-8">
          <Icons.close aria-hidden />
        </Button>
      </div>
      {tab === "scientific" ? <Scientific /> : <Grapher />}
    </section>
  )
}

function Scientific() {
  const t = useT("examPlayer")
  const [input, setInput] = useState("")
  const [history, setHistory] = useState<{ expr: string; value: string }[]>([])
  const run = () => {
    const value = evaluate(input)
    const shown = value === null ? t("calc.error") : String(Number(value.toPrecision(12)))
    setHistory((items) => [{ expr: input, value: shown }, ...items].slice(0, 8))
    if (value !== null) setInput(shown)
  }
  return (
    <div className="flex flex-col gap-2">
      <ul
        aria-live="polite"
        className="bg-muted/40 flex max-h-24 min-h-10 flex-col-reverse overflow-auto rounded p-2 text-right font-mono text-xs"
      >
        {history.map((item, i) => (
          <li key={i}>
            {item.expr} = <strong>{item.value}</strong>
          </li>
        ))}
      </ul>
      <Input
        aria-label={t("calc.expression")}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && run()}
        className="h-11 text-right font-mono"
        autoFocus
      />
      <div className="grid grid-cols-4 gap-1">
        {KEYS.map((key) => (
          <Button
            key={key}
            variant="outline"
            size="sm"
            className="min-h-10 font-mono"
            onClick={() => setInput((v) => v + key)}
          >
            {key.replace("(", "")}
          </Button>
        ))}
        <Button variant="outline" size="sm" className="min-h-10" onClick={() => setInput("")}>
          AC
        </Button>
        <Button variant="outline" size="sm" className="min-h-10" onClick={() => setInput((v) => v.slice(0, -1))}>
          ⌫
        </Button>
        <Button size="sm" className="col-span-2 min-h-10" onClick={run}>
          =
        </Button>
      </div>
    </div>
  )
}

function Grapher() {
  const t = useT("examPlayer")
  const [exprs, setExprs] = useState(["x^2", "", ""])
  const [scale, setScale] = useState(10)
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const el = canvas.current
    const ctx = el?.getContext("2d")
    if (!el || !ctx) return
    const size = el.width
    const unit = size / (2 * scale)
    const px = (x: number) => size / 2 + x * unit
    const py = (y: number) => size / 2 - y * unit
    ctx.clearRect(0, 0, size, size)
    ctx.fillStyle = "#fff"
    ctx.fillRect(0, 0, size, size)
    ctx.strokeStyle = "#e5e7eb"
    ctx.lineWidth = 1
    for (let i = -scale; i <= scale; i += 1) {
      ctx.beginPath()
      ctx.moveTo(px(i), 0)
      ctx.lineTo(px(i), size)
      ctx.moveTo(0, py(i))
      ctx.lineTo(size, py(i))
      ctx.stroke()
    }
    ctx.strokeStyle = "#6b7280"
    ctx.beginPath()
    ctx.moveTo(px(0), 0)
    ctx.lineTo(px(0), size)
    ctx.moveTo(0, py(0))
    ctx.lineTo(size, py(0))
    ctx.stroke()
    exprs.forEach((expr, index) => {
      if (expr.trim() === "") return
      let fn: (x: number) => number
      try {
        fn = compile(expr)
      } catch {
        return
      }
      ctx.strokeStyle = COLORS[index] ?? "#000"
      ctx.lineWidth = 2
      ctx.beginPath()
      let drawing = false
      for (let sx = 0; sx <= size; sx += 1) {
        const y = fn((sx - size / 2) / unit)
        if (!Number.isFinite(y) || Math.abs(y) > scale * 50) {
          drawing = false
          continue
        }
        if (drawing) ctx.lineTo(sx, py(y))
        else ctx.moveTo(sx, py(y))
        drawing = true
      }
      ctx.stroke()
    })
  }, [exprs, scale])

  return (
    <div className="flex flex-col gap-2">
      {exprs.map((expr, index) => (
        <label key={index} className="flex items-center gap-2 font-mono text-sm">
          <span className="shrink-0 whitespace-nowrap" style={{ color: COLORS[index] }}>
            y =
          </span>
          <Input
            aria-label={t("calc.function", { number: index + 1 })}
            value={expr}
            onChange={(e) => setExprs((items) => items.map((item, i) => (i === index ? e.target.value : item)))}
            className="h-10"
          />
        </label>
      ))}
      <canvas
        ref={canvas}
        width={320}
        height={320}
        className="w-full rounded border"
        role="img"
        aria-label={t("calc.graph")}
      />
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          aria-label={t("zoomIn")}
          onClick={() => setScale((s) => Math.max(1, s / 2))}
        >
          +
        </Button>
        <span className="text-muted-foreground text-xs">±{scale}</span>
        <Button
          variant="outline"
          size="sm"
          aria-label={t("zoomOut")}
          onClick={() => setScale((s) => Math.min(1000, s * 2))}
        >
          −
        </Button>
      </div>
    </div>
  )
}
