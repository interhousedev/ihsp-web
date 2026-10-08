"use client"

import { useT } from "@ihsp/i18n"
import { getConfig } from "@ihsp/config"
import type { ComponentProps, ReactNode } from "react"
import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "../lib/utils"

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

const components: Components = {
  a: ({ href, children }) => <MarkdownLink href={href}>{children}</MarkdownLink>,
  img: ({ src, alt }) => <MarkdownImage src={src} alt={alt} />,
  h1: ({ children }) => <h2 className="mt-4 mb-2 text-xl font-semibold first:mt-0">{children}</h2>,
  h2: ({ children }) => <h3 className="mt-4 mb-2 text-lg font-semibold first:mt-0">{children}</h3>,
  h3: ({ children }) => <h4 className="mt-3 mb-1 text-base font-semibold first:mt-0">{children}</h4>,
  h4: ({ children }) => <h5 className="mt-3 mb-1 text-sm font-semibold first:mt-0">{children}</h5>,
  p: (props) => <p className="my-2 leading-relaxed first:mt-0 last:mb-0" {...omitNode(props)} />,
  ul: (props) => <ul className="my-2 list-disc ps-6" {...omitNode(props)} />,
  ol: (props) => <ol className="my-2 list-decimal ps-6" {...omitNode(props)} />,
  li: (props) => <li className="my-0.5" {...omitNode(props)} />,
  blockquote: (props) => (
    <blockquote className="border-border text-muted-foreground my-2 border-s-4 ps-3" {...omitNode(props)} />
  ),
  hr: () => <hr className="border-border my-4" />,
  pre: (props) => <pre className="bg-muted my-2 overflow-x-auto rounded-md p-3 text-xs" {...omitNode(props)} />,
  code: ({ className, children }) => (
    <code
      className={cn(
        "bg-muted rounded px-1 py-0.5 font-mono text-[0.85em] [pre_&]:bg-transparent [pre_&]:p-0",
        className,
      )}
    >
      {children}
    </code>
  ),
  table: (props) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...omitNode(props)} />
    </div>
  ),
  th: (props) => <th className="border-border border px-2 py-1 text-start font-medium" {...omitNode(props)} />,
  td: (props) => <td className="border-border border px-2 py-1 align-top" {...omitNode(props)} />,
}

/** react-markdown passes the AST node as a prop; it must not reach the DOM. */
function omitNode<T extends { node?: unknown }>(props: T): Omit<T, "node"> {
  const { node: _node, ...rest } = props
  return rest
}

/**
 * Safe Markdown renderer (GFM). Raw HTML is not rendered, links to other sites open in a new tab and show the full
 * address on hover, images load only from this app or our storage (no external images).
 */
export function Markdown({
  children,
  className,
  ...props
}: { children: string; className?: string } & Omit<ComponentProps<"div">, "children">) {
  return (
    <div className={cn("text-sm break-words", className)} {...props}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
