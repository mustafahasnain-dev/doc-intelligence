import React from "react";

// Regex to match chunk ID references like [uuid-p1-c0]
const CHUNK_REF_REGEX = /\[[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}-p\d+-c\d+\]/gi;

// Regex to match markdown headings like ##, ###, etc.
const HEADING_REGEX = /^#+\s*/gm;

// Regex to match **bold** text
const BOLD_REGEX = /\*\*(.+?)\*\*/g;

/**
 * Strips chunk ID references, markdown headings, and renders basic markdown (bold)
 * from Claude's raw response text.
 */
export function formatMessage(text: string): React.ReactNode[] {
  // First strip chunk references and headings
  let cleaned = text
    .replace(CHUNK_REF_REGEX, "")
    .replace(HEADING_REGEX, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Split by bold markers, preserving groups
  const parts = cleaned.split(BOLD_REGEX);
  const nodes: React.ReactNode[] = [];

  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) {
      // Odd indices are bold captures
      nodes.push(<strong key={i}>{parts[i]}</strong>);
    } else if (parts[i]) {
      nodes.push(parts[i]);
    }
  }

  return nodes;
}
