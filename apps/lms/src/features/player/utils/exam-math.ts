// A tiny safe expression evaluator for the exam calculator (no `eval`): + - * / ^, parentheses,
// unary minus, implicit multiplication (2x, 3(4)), constants pi and e, the variable x, and functions.

const FUNCTIONS: Record<string, (value: number) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sqrt: Math.sqrt,
  abs: Math.abs,
  ln: Math.log,
  log: Math.log10,
  exp: Math.exp,
}

type Token = { kind: "num"; value: number } | { kind: "id"; value: string } | { kind: "op"; value: string }

function tokenize(source: string): Token[] {
  const tokens: Token[] = []
  const text = source.replace(/π/g, "pi").replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-")
  let i = 0
  while (i < text.length) {
    const char = text[i] ?? ""
    if (/\s/.test(char)) {
      i += 1
    } else if (/[0-9.]/.test(char)) {
      const match = /^[0-9]*\.?[0-9]+(e[+-]?[0-9]+)?|^[0-9]+\.?/.exec(text.slice(i))
      if (!match) throw new Error("number")
      tokens.push({ kind: "num", value: Number(match[0]) })
      i += match[0].length
    } else if (/[a-z]/i.test(char)) {
      const match = /^[a-z]+/i.exec(text.slice(i))
      const word = (match?.[0] ?? "").toLowerCase()
      tokens.push({ kind: "id", value: word })
      i += word.length
    } else if ("+-*/^()".includes(char)) {
      tokens.push({ kind: "op", value: char })
      i += 1
    } else {
      throw new Error(`unexpected ${char}`)
    }
  }
  return tokens
}

/** Parse an expression into a function of x; throws on a syntax error. */
export function compile(source: string): (x: number) => number {
  const tokens = tokenize(source)
  let pos = 0
  const peek = () => tokens[pos]
  const isOp = (value: string) => peek()?.kind === "op" && peek()?.value === value
  const startsFactor = () => {
    const token = peek()
    return token !== undefined && (token.kind !== "op" || token.value === "(")
  }

  type Node = (x: number) => number
  function expression(): Node {
    let left = term()
    while (isOp("+") || isOp("-")) {
      const op = tokens[pos++]?.value
      const right = term()
      const l = left
      left = op === "+" ? (x) => l(x) + right(x) : (x) => l(x) - right(x)
    }
    return left
  }
  function term(): Node {
    let left = unary()
    for (;;) {
      if (isOp("*") || isOp("/")) {
        const op = tokens[pos++]?.value
        const right = unary()
        const l = left
        left = op === "*" ? (x) => l(x) * right(x) : (x) => l(x) / right(x)
      } else if (startsFactor()) {
        const right = power()
        const l = left
        left = (x) => l(x) * right(x)
      } else {
        return left
      }
    }
  }
  function unary(): Node {
    if (isOp("-")) {
      pos += 1
      const inner = unary()
      return (x) => -inner(x)
    }
    if (isOp("+")) pos += 1
    return power()
  }
  function power(): Node {
    const base = atom()
    if (isOp("^")) {
      pos += 1
      const exponent = unary()
      return (x) => base(x) ** exponent(x)
    }
    return base
  }
  function atom(): Node {
    const token = tokens[pos++]
    if (!token) throw new Error("end")
    if (token.kind === "num") return () => token.value
    if (token.kind === "op" && token.value === "(") {
      const inner = expression()
      if (!isOp(")")) throw new Error(")")
      pos += 1
      return inner
    }
    if (token.kind === "id") {
      if (token.value === "x") return (x) => x
      if (token.value === "pi") return () => Math.PI
      if (token.value === "e") return () => Math.E
      const fn = FUNCTIONS[token.value]
      if (fn) {
        const arg = power()
        return (x) => fn(arg(x))
      }
    }
    throw new Error("token")
  }

  const node = expression()
  if (pos !== tokens.length) throw new Error("trailing")
  return node
}

/** Evaluate a constant expression; `null` when it is invalid or not finite. */
export function evaluate(source: string): number | null {
  try {
    const value = compile(source)(0)
    return Number.isFinite(value) ? value : null
  } catch {
    return null
  }
}

/** Seconds as `m:ss` (or `h:mm:ss`). */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, "0")
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`
}
