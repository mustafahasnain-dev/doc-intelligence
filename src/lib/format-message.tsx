import React from "react";

// Regex to match chunk ID references like [filename_abc123-p1-c0] or old UUID format
const CHUNK_REF_REGEX = /\[.*?-p\d+-c\d+\]/gi;

/**
 * Strips chunk ID references and renders clean markdown from Claude's response.
 * Handles: headings, bold, italic, bullet lists, numbered lists, code blocks, and paragraphs.
 */
export function formatMessage(text: string): React.ReactNode[] {
  // Strip chunk references
  const cleaned = text.replace(CHUNK_REF_REGEX, "").trim();

  const lines = cleaned.split("\n");
  const nodes: React.ReactNode[] = [];
  let key = 0;
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block toggle
    if (line.trimStart().startsWith("```")) {
      if (inCodeBlock) {
        nodes.push(
          <pre key={key++} className="bg-muted/60 border border-border/40 rounded-lg px-3 py-2 my-2 overflow-x-auto text-xs font-mono">
            <code>{codeBuffer.join("\n")}</code>
          </pre>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Empty line → spacing
    if (!line.trim()) {
      nodes.push(<div key={key++} className="h-2" />);
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,4})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      const className =
        level === 1
          ? "text-base font-bold mt-3 mb-1.5"
          : level === 2
          ? "text-sm font-bold mt-2.5 mb-1"
          : "text-sm font-semibold mt-2 mb-0.5";
      nodes.push(
        <div key={key++} className={className}>
          {renderInline(content)}
        </div>
      );
      continue;
    }

    // Bullet list items
    const bulletMatch = line.match(/^(\s*)[-*]\s+(.+)/);
    if (bulletMatch) {
      const indent = Math.floor((bulletMatch[1]?.length || 0) / 2);
      nodes.push(
        <div key={key++} className="flex gap-1.5 items-start" style={{ paddingLeft: `${indent * 12}px` }}>
          <span className="text-primary mt-1.5 text-[6px] shrink-0">●</span>
          <span>{renderInline(bulletMatch[2])}</span>
        </div>
      );
      continue;
    }

    // Numbered list items
    const numberedMatch = line.match(/^(\s*)\d+[.)]\s+(.+)/);
    if (numberedMatch) {
      const num = line.match(/^(\s*)(\d+)/);
      const indent = Math.floor((numberedMatch[1]?.length || 0) / 2);
      nodes.push(
        <div key={key++} className="flex gap-1.5 items-start" style={{ paddingLeft: `${indent * 12}px` }}>
          <span className="text-primary font-medium shrink-0 min-w-[1.2em]">{num ? num[2] : ""}.</span>
          <span>{renderInline(numberedMatch[2])}</span>
        </div>
      );
      continue;
    }

    // Regular paragraph
    nodes.push(
      <p key={key++} className="my-0.5">
        {renderInline(line)}
      </p>
    );
  }

  // Close unclosed code block
  if (inCodeBlock && codeBuffer.length > 0) {
    nodes.push(
      <pre key={key++} className="bg-muted/60 border border-border/40 rounded-lg px-3 py-2 my-2 overflow-x-auto text-xs font-mono">
        <code>{codeBuffer.join("\n")}</code>
      </pre>
    );
  }

  return nodes;
}

/** Render inline markdown: bold, italic, inline code */
function renderInline(text: string): React.ReactNode[] {
  // Match **bold**, *italic*, `code`
  const parts = text.split(/(\*\*\*.+?\*\*\*|\*\*.+?\*\*|\*.+?\*|`.+?`)/g);
  const nodes: React.ReactNode[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;

    if (part.startsWith("***") && part.endsWith("***")) {
      nodes.push(<strong key={i}><em>{part.slice(3, -3)}</em></strong>);
    } else if (part.startsWith("**") && part.endsWith("**")) {
      nodes.push(<strong key={i}>{part.slice(2, -2)}</strong>);
    } else if (part.startsWith("*") && part.endsWith("*")) {
      nodes.push(<em key={i}>{part.slice(1, -1)}</em>);
    } else if (part.startsWith("`") && part.endsWith("`")) {
      nodes.push(
        <code key={i} className="bg-muted/60 px-1 py-0.5 rounded text-xs font-mono">
          {part.slice(1, -1)}
        </code>
      );
    } else {
      nodes.push(part);
    }
  }

  return nodes;
}
