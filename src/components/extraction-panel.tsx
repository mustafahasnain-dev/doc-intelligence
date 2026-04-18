"use client";

import { useState } from "react";
import { LayoutGrid, Loader2, Download, FileText, Receipt, FileSignature, CreditCard } from "lucide-react";
import { useDocumentStore } from "@/store/document-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ExtractionType, ExtractionResult } from "@/lib/types";
import { exportAsJSON, exportAsCSV, downloadFile } from "@/lib/export";

const EXTRACTION_TYPES: { value: ExtractionType; label: string; icon: React.ElementType }[] = [
  { value: "invoice", label: "Invoice", icon: Receipt },
  { value: "contract", label: "Contract", icon: FileSignature },
  { value: "receipt", label: "Receipt", icon: CreditCard },
  { value: "generic", label: "Generic", icon: FileText },
];

const confidenceColor: Record<string, string> = {
  high: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  low: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

export function ExtractionPanel() {
  const selectedIds = useDocumentStore((s) => s.selectedDocumentIds);
  const extractions = useDocumentStore((s) => s.extractions);
  const documents = useDocumentStore((s) => s.documents);
  const chunks = useDocumentStore((s) => s.chunks);
  const addExtraction = useDocumentStore((s) => s.addExtraction);

  const [extractionType, setExtractionType] =
    useState<ExtractionType>("generic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allExtractions: (ExtractionResult & { docName: string })[] =
    selectedIds.flatMap((id) =>
      (extractions[id] || []).map((e) => ({
        ...e,
        docName: documents.find((d) => d.id === id)?.name || id,
      }))
    );

  const handleExtract = async () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      for (const docId of selectedIds) {
        const docChunks = chunks[docId] || [];
        if (docChunks.length === 0) continue;

        const res = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentId: docId,
            extractionType,
            chunks: docChunks,
          }),
        });

        const data = await res.json();
        if (data.success && data.result) {
          addExtraction(docId, data.result);
        } else {
          setError(data.error || "Extraction failed");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: "json" | "csv") => {
    const results = allExtractions;
    if (results.length === 0) return;
    if (format === "json") {
      downloadFile(exportAsJSON(results), "extractions.json", "application/json");
    } else {
      downloadFile(exportAsCSV(results), "extractions.csv", "text/csv");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-6 rounded-md gradient-primary flex items-center justify-center">
            <LayoutGrid className="h-3 w-3 text-white" />
          </div>
          <h3 className="text-sm font-semibold">Extracted Data</h3>
        </div>
        {allExtractions.length > 0 && (
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1 rounded-lg border-border/50 hover:bg-muted"
              onClick={() => handleExport("json")}
            >
              <Download className="h-3 w-3" /> JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1 rounded-lg border-border/50 hover:bg-muted"
              onClick={() => handleExport("csv")}
            >
              <Download className="h-3 w-3" /> CSV
            </Button>
          </div>
        )}
      </div>

      {/* Extraction controls */}
      <div className="px-5 py-3.5 border-b border-border/50 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Type:</span>
          {EXTRACTION_TYPES.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.value}
                onClick={() => setExtractionType(t.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  extractionType === t.value
                    ? "gradient-primary text-white shadow-sm"
                    : "bg-muted hover:bg-accent text-muted-foreground"
                }`}
              >
                <Icon className="h-3 w-3" />
                {t.label}
              </button>
            );
          })}
        </div>
        <Button
          onClick={handleExtract}
          disabled={loading || selectedIds.length === 0}
          size="sm"
          className="gap-2 gradient-primary text-white shadow-sm hover:shadow-md transition-all disabled:opacity-40"
        >
          {loading && <Loader2 className="h-3 w-3 animate-spin" />}
          {loading ? "Extracting\u2026" : "Extract Data"}
        </Button>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      {/* Results */}
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="px-5 py-4">
          {allExtractions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in-up">
              <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <LayoutGrid className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium">
                No extracted data yet
              </p>
              <p className="text-xs text-muted-foreground mt-1.5 max-w-65">
                Select a document and click &quot;Extract Data&quot; to see
                structured data here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {allExtractions.map((ext, idx) => (
                <Card key={ext.id} className="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <div className="h-1 w-full gradient-primary" />
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold">{ext.docName}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {ext.extractionType} &middot;{" "}
                          {new Date(ext.extractedAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                        {ext.fields.length} fields
                      </Badge>
                    </div>
                    <div className="space-y-1.5">
                      {ext.fields.map((field, i) => (
                        <div
                          key={`${ext.id}-${field.key}-${i}`}
                          className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 border border-border/30"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{field.label}</p>
                            <p className="text-sm font-medium mt-0.5 truncate">
                              {field.value ?? "N/A"}
                            </p>
                          </div>
                          <Badge
                            className={`text-[10px] ml-2 shrink-0 border-0 ${
                              confidenceColor[field.confidence]
                            }`}
                          >
                            {field.confidence}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
