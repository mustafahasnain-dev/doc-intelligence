// Export utilities for JSON and CSV
// Will be fully implemented in Phase 6

import type { ExtractionResult } from "@/lib/types";

export function exportAsJSON(results: ExtractionResult[]): string {
  return JSON.stringify(results, null, 2);
}

export function exportAsCSV(results: ExtractionResult[]): string {
  if (results.length === 0) return "";

  // Collect all unique field keys
  const allKeys = new Set<string>();
  for (const result of results) {
    for (const field of result.fields) {
      allKeys.add(field.key);
    }
  }

  const headers = ["documentId", "extractionType", ...Array.from(allKeys)];
  const rows = results.map((result) => {
    const row: Record<string, string> = {
      documentId: result.documentId,
      extractionType: result.extractionType,
    };
    for (const field of result.fields) {
      row[field.key] = String(field.value ?? "");
    }
    return headers.map((h) => `"${(row[h] || "").replace(/"/g, '""')}"`).join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

export function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
