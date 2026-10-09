"use client"

import { useT } from "@ihsp/i18n"
import { getConfig } from "@ihsp/config"
import { Children, createContext, useContext, type ComponentProps, type ReactNode } from "react"
import ReactMarkdown, { type Components, type ExtraProps } from "react-markdown"
import { markdownRemarkPlugins } from "../lib/markdown/parse-markdown"
import { cn } from "../lib/utils"
import { MarkdownCodeBlock } from "./markdown-code-block"
import { MarkdownSpoiler } from "./markdown-spoiler"
import { MathFormula } from "./math-formula"

function storageOrigin(): string | null {
  try {
    return getConfig().STORAGE_ORIGIN
  } catch {
    return null
  }
}

/** Images are allowed only from this app, `blob:` previews and our own storage (CSP `img-src`, AI-4). */
export function isAllowedImageSource(src: string, origin: string | null = storageOrigin()): boolean {
  if (src.startsWith("blob:")) return true
  if (src.startsWith("/") && !src.startsWith("//")) return true
  return origin !== null && (src === origin || src.startsWith(`${origin}/`))
}

function MarkdownLink({ href, children }: { href?: string; children?: ReactNode }) {
  const t = useT()
  if (!href) return <span>{children}</span>
  const internal = href.startsWith("#") || (href.startsWith("/") && !href.startsWith("//"))
  if (internal) {
    return (
      <a href={href} className="text-primary underline underline-offset-2">
        {children}
      </a>
    )
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      title={t("markdown.externalLink", { url: href })}
      className="text-primary break-words underline underline-offset-2"
    >
      {children}
    </a>
  )
}

function MarkdownImage({ src, alt }: { src?: string | Blob; alt?: string }) {
  const t = useT()
  if (typeof src !== "string" || !isAllowedImageSource(src)) {
    return <span className="text-muted-foreground italic">{t("markdown.imageBlocked", { alt: alt ?? "" })}</span>
  }
  return <img src={src} alt={alt ?? ""} loading="lazy" className="my-2 max-w-full rounded-md" />
}

/** Turns the plain text inside Markdown into nodes (notebook answers put citation chips where `⟦n⟧` markers are). */
export type RenderText = (text: string) => ReactNode

const RenderTextContext = createContext<RenderText | null>(null)

function mapText(children: ReactNode, render: RenderText): ReactNode {
  return Children.map(children, (child) => (typeof child === "string" ? render(child) : child))
}

/** Children of a text-bearing element, run through the `renderText` of the surrounding `Markdown` (if any). */
function Inline({ children }: { children?: ReactNode }) {
  const render = useContext(RenderTextContext)
  return <>{render ? mapText(children, render) : children}</>
}

type HastNode = ExtraProps["node"]

/** The class names of a hast element (`["language-math", "math-display"]`). */
function classNamesOf(node: HastNode | NonNullable<HastNode>["children"][number] | undefined): string[] {
  if (node?.type !== "element") return []
  const value = node.properties.className
  return Array.isArray(value) ? value.map(String) : []
}

/** The text of a code element (react-markdown passes it as a string). */
function textOf(children: ReactNode): string {
  return Children.toArray(children)
    .filter((child) => typeof child === "string" || typeof child === "number")
    .join("")
}

/** `<pre><code class="language-x">`: display math (`$$` lines) renders without the code frame. */
function Pre({ node, children }: { node?: HastNode; children?: ReactNode }) {
  const classes = classNamesOf(node?.children[0])
  if (classes.includes("language-math")) return <>{children}</>
  const language = classes.find((name) => name.startsWith("language-"))?.slice("language-".length) || null
  return <MarkdownCodeBlock language={language}>{children}</MarkdownCodeBlock>
}

const components: Components = {
  a: ({ href, children }) => <MarkdownLink href={href}>{children}</MarkdownLink>,
  img: ({ src, alt }) => <MarkdownImage src={src} alt={alt} />,
  h1: ({ children }) => (
    <h2 className="mt-4 mb-2 text-xl font-semibold first:mt-0">
      <Inline>{children}</Inline>
    </h2>
  ),
  h2: ({ children }) => (
    <h3 className="mt-4 mb-2 text-lg font-semibold first:mt-0">
      <Inline>{children}</Inline>
    </h3>
  ),
  h3: ({ children }) => (
    <h4 className="mt-3 mb-1 text-base font-semibold first:mt-0">
      <Inline>{children}</Inline>
    </h4>
  ),
  h4: ({ children }) => (
    <h5 className="mt-3 mb-1 text-sm font-semibold first:mt-0">
      <Inline>{children}</Inline>
    </h5>
  ),
  p: ({ children, ...props }) => (
    <p className="my-2 leading-relaxed first:mt-0 last:mb-0" {...omitNode(props)}>
      <Inline>{children}</Inline>
    </p>
  ),
  strong: ({ children }) => (
    <strong>
      <Inline>{children}</Inline>
    </strong>
  ),
  em: ({ children }) => (
    <em>
      <Inline>{children}</Inline>
    </em>
  ),
  ul: (props) => <ul className="my-2 list-disc ps-6" {...omitNode(props)} />,
  ol: (props) => <ol className="my-2 list-decimal ps-6" {...omitNode(props)} />,
  li: ({ children, ...props }) => (
    <li className="my-0.5" {...omitNode(props)}>
      <Inline>{children}</Inline>
    </li>
  ),
  blockquote: (props) => (
    <blockquote className="border-border text-muted-foreground my-2 border-s-4 ps-3" {...omitNode(props)} />
  ),
  hr: () => <hr className="border-border my-4" />,
  pre: ({ node, children }) => <Pre node={node}>{children}</Pre>,
  code: ({ className, children }) => {
    const classes = className?.split(" ") ?? []
    if (classes.includes("language-math")) {
      return <MathFormula source={textOf(children)} display={classes.includes("math-display")} />
    }
    return (
      <code
        className={cn(
          "bg-muted rounded px-1 py-0.5 font-mono text-[0.85em] [pre_&]:bg-transparent [pre_&]:p-0",
          className,
        )}
      >
        {children}
      </code>
    )
  },
  del: ({ children }) => (
    <del>
      <Inline>{children}</Inline>
    </del>
  ),
  u: ({ children }) => (
    <u className="underline underline-offset-2">
      <Inline>{children}</Inline>
    </u>
  ),
  span: ({ node, children }) =>
    node?.properties.dataSpoiler !== undefined ? (
      <MarkdownSpoiler>
        <Inline>{children}</Inline>
      </MarkdownSpoiler>
    ) : (
      <span>{children}</span>
    ),
  table: (props) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...omitNode(props)} />
    </div>
  ),
  th: ({ children, ...props }) => (
    <th className="border-border border px-2 py-1 text-start font-medium" {...omitNode(props)}>
      <Inline>{children}</Inline>
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="border-border border px-2 py-1 align-top" {...omitNode(props)}>
      <Inline>{children}</Inline>
    </td>
  ),
}

/** react-markdown passes the AST node as a prop; it must not reach the DOM. */
function omitNode<T extends { node?: unknown }>(props: T): Omit<T, "node"> {
  const { node: _node, ...rest } = props
  return rest
}

/**
 * Safe Markdown renderer: GFM plus `$math$` / `$$display math$$` (KaTeX), `||spoilers||` and `<u>underline</u>` (see
 * `remarkIhsp`). Raw HTML is shown as text, never rendered; links to other sites open in a new tab and show the full
 * address on hover; images load only from this app or our storage (no external images).
 */
export function Markdown({
  children,
  className,
  renderText,
  ...props
}: {
  children: string
  className?: string
  /** Renders the plain text of paragraphs, list items, headings, table cells and bold/italic runs (e.g. citation chips). */
  renderText?: RenderText
} & Omit<ComponentProps<"div">, "children">) {
  return (
    <div className={cn("text-sm break-words", className)} {...props}>
      <RenderTextContext.Provider value={renderText ?? null}>
        <ReactMarkdown remarkPlugins={markdownRemarkPlugins} components={components}>
          {children}
        </ReactMarkdown>
      </RenderTextContext.Provider>
    </div>
  )
}
