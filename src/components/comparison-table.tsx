"use client";

import { useState } from "react";
import { Columns3, Loader2, Download } from "lucide-react";
import { useDocumentStore } from "@/store/document-store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { ComparisonResult } from "@/lib/types";
import { downloadFile } from "@/lib/export";

export function ComparisonTable() {
  const selectedIds = useDocumentStore((s) => s.selectedDocumentIds);
  const documents = useDocumentStore((s) => s.documents);
  const extractions = useDocumentStore((s) => s.extractions);

  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const docsWithExtractions = selectedIds.filter(
    (id) => extractions[id] && extractions[id].length > 0
  );
  const canCompare = docsWithExtractions.length >= 2;

  const handleCompare = async () => {
    if (!canCompare) return;
    setLoading(true);
    setError(null);

    try {
      const extractionData = docsWithExtractions.map((docId) => ({
        documentId: docId,
        fields: extractions[docId][extractions[docId].length - 1].fields.map(
          (f) => ({ key: f.key, label: f.label, value: f.value })
        ),
      }));

      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentIds: docsWithExtractions,
          extractions: extractionData,
        }),
      });

      const data = await res.json();
      if (data.success && data.result) {
        setComparison(data.result);
      } else {
        setError(data.error || "Comparison failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Comparison failed");
    } finally {
      setLoading(false);
    }
  };

  const getDocName = (id: string) =>
    documents.find((d) => d.id === id)?.name || id.slice(0, 8);

  const handleExportComparison = () => {
    if (!comparison) return;
    const data = JSON.stringify(comparison, null, 2);
    downloadFile(data, "comparison.json", "application/json");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-5 py-3.5 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-6 rounded-md gradient-primary flex items-center justify-center">
            <Columns3 className="h-3 w-3 text-white" />
          </div>
          <h3 className="text-sm font-semibold">Document Comparison</h3>
        </div>
        {comparison && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1 rounded-lg border-border/50 hover:bg-muted"
            onClick={handleExportComparison}
          >
            <Download className="h-3 w-3" /> Export
          </Button>
        )}
      </div>

      {/* Controls */}
      <div className="px-3 sm:px-5 py-3.5 border-b border-border/50">
        <Button
          onClick={handleCompare}
          disabled={loading || !canCompare}
          size="sm"
          className="gap-2 gradient-primary text-white shadow-sm hover:shadow-md transition-all disabled:opacity-40"
        >
          {loading && <Loader2 className="h-3 w-3 animate-spin" />}
          {loading ? "Comparing\u2026" : "Compare Documents"}
        </Button>
        {!canCompare && selectedIds.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            Extract data from at least 2 selected documents first.
          </p>
        )}
        {error && <p className="text-xs text-destructive mt-2">{error}</p>}
      </div>

      {/* Table */}
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="px-3 sm:px-5 py-4">
          {!comparison ? (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in-up">
              <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Columns3 className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium">
                Compare documents side by side
              </p>
              <p className="text-xs text-muted-foreground mt-1.5 max-w-xs">
                Select 2+ documents, extract data from each, then click
                &quot;Compare Documents&quot;.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/50 shadow-sm animate-fade-in-up">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
                      Field
                    </th>
                    {comparison.documentIds.map((id) => (
                      <th
                        key={id}
                        className="text-left py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground max-w-50"
                      >
                        <span className="truncate block">
                          {getDocName(id)}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparison.rows.map((row, i) => (
                    <tr
                      key={row.field}
                      className={`border-t border-border/30 transition-colors hover:bg-muted/30 ${
                        row.isDifferent ? "bg-amber-50/60 dark:bg-amber-950/10" : i % 2 !== 0 ? "bg-muted/20" : ""
                      }`}
                    >
                      <td className="py-2.5 px-4 font-medium">
                        {row.label}
                        {row.isDifferent && (
                          <Badge
                            variant="secondary"
                            className="ml-2 text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-0"
                          >
                            differs
                          </Badge>
                        )}
                      </td>
                      {comparison.documentIds.map((docId) => (
                        <td key={docId} className="py-2.5 px-4">
                          {row.values[docId] ?? (
                            <span className="text-muted-foreground italic">N/A</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
