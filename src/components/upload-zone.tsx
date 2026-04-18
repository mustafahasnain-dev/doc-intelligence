"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useDocumentStore } from "@/store/document-store";
import { parsePDF } from "@/lib/pdf-parser";

interface UploadZoneProps {
  open: boolean;
  onClose: () => void;
}

export function UploadZone({ open, onClose }: UploadZoneProps) {
  const addDocument = useDocumentStore((s) => s.addDocument);
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) {
      setFile(accepted[0]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
  });

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const { document, chunks } = await parsePDF(file, description);
      addDocument(document, chunks);
      setFile(null);
      setDescription("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse PDF");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 glass animate-fade-in-up"
        style={{ animationDuration: "0.15s" }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-fade-in-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg gradient-primary flex items-center justify-center">
              <Upload className="h-3.5 w-3.5 text-white" />
            </div>
            <h3 className="text-base font-semibold">Upload PDF</h3>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragActive
                ? "border-primary bg-primary/5 scale-[1.02]"
                : file
                ? "border-primary/30 bg-primary/[0.03]"
                : "border-border hover:border-primary/40 hover:bg-muted/40"
            }`}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="flex flex-col items-center gap-2 animate-fade-in-up" style={{ animationDuration: "0.2s" }}>
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">
                  {isDragActive ? "Drop your file here" : "Drag & drop or click to browse"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  PDF files up to 50 MB
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Description (optional)
            </label>
            <Textarea
              placeholder="Add a brief description of the document..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl resize-none min-h-20 text-sm border-border/50 focus-visible:ring-primary/30"
              rows={3}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl border-border/50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || loading}
              className="flex-1 gap-2 rounded-xl gradient-primary text-white shadow-sm hover:shadow-md transition-all disabled:opacity-40"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {loading ? "Processing\u2026" : "Upload & Parse"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
