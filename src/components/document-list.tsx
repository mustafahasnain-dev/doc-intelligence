"use client";

import { FileText, Plus, CheckCircle2, Circle, Trash2 } from "lucide-react";
import { useDocumentStore } from "@/store/document-store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface DocumentListProps {
  onUploadClick: () => void;
}

export function DocumentList({ onUploadClick }: DocumentListProps) {
  const documents = useDocumentStore((s) => s.documents);
  const selectedIds = useDocumentStore((s) => s.selectedDocumentIds);
  const toggleSelection = useDocumentStore((s) => s.toggleDocumentSelection);
  const removeDocument = useDocumentStore((s) => s.removeDocument);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight">Documents</h2>
          <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20">
            {documents.length}
          </Badge>
        </div>
        <Button
          onClick={onUploadClick}
          size="sm"
          className="w-full gap-2 gradient-primary text-white shadow-sm hover:shadow-md transition-all"
        >
          <Plus className="h-4 w-4" />
          Upload Document
        </Button>
      </div>

      <Separator className="opacity-50" />

      <ScrollArea className="flex-1">
        {documents.length === 0 ? (
          <div className="p-6 text-center animate-fade-in-up">
            <div className="h-12 w-12 mx-auto rounded-xl bg-muted flex items-center justify-center mb-3">
              <FileText className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              No documents yet
            </p>
            <p className="text-[11px] text-muted-foreground/70 mt-1">
              Upload a PDF to get started
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {documents.map((doc) => {
              const isSelected = selectedIds.includes(doc.id);
              return (
                <div
                  key={doc.id}
                  className={`group flex items-start gap-3 rounded-xl px-3 py-3 text-sm transition-all duration-200 hover:bg-accent/60 hover:shadow-sm ${
                    isSelected
                      ? "bg-primary/6 border border-primary/20 shadow-sm"
                      : "border border-transparent"
                  }`}
                >
                  <button
                    onClick={() => toggleSelection(doc.id)}
                    className="flex items-start gap-3 flex-1 min-w-0 text-left"
                  >
                    {isSelected ? (
                      <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    ) : (
                      <Circle className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground/40" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={`font-medium truncate text-[13px] ${isSelected ? "text-foreground" : "text-foreground/80"}`}>
                        {doc.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {doc.totalPages}{" "}
                        {doc.totalPages === 1 ? "page" : "pages"} &middot;{" "}
                        {doc.totalChunks} chunks
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeDocument(doc.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
                    title="Remove document"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive transition-colors" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
