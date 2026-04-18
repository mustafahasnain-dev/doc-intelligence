// ── Core Document Types ──────────────────────────────────────────────

export interface UploadedDocument {
  id: string;
  name: string;
  type: "pdf" | "text";
  uploadedAt: Date;
  totalPages: number;
  totalChunks: number;
  sizeBytes: number;
  description?: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  pageNumber: number;
  chunkIndex: number;
  text: string;
  charStart: number;
  charEnd: number;
}

// ── Chat Types ───────────────────────────────────────────────────────

export interface Citation {
  chunkId: string;
  documentId: string;
  documentName: string;
  pageNumber: number;
  snippet: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: Citation[];
  timestamp: Date;
}

// ── Extraction Types ─────────────────────────────────────────────────

export type ExtractionType = "invoice" | "contract" | "receipt" | "generic";

export interface ExtractionField {
  key: string;
  label: string;
  value: string | number | null;
  confidence: "high" | "medium" | "low";
}

export interface ExtractionResult {
  id: string;
  documentId: string;
  extractionType: ExtractionType;
  fields: ExtractionField[];
  rawResponse: string;
  extractedAt: Date;
}

// ── Comparison Types ─────────────────────────────────────────────────

export interface ComparisonRow {
  field: string;
  label: string;
  values: Record<string, string | number | null>; // documentId → value
  isDifferent: boolean;
}

export interface ComparisonResult {
  documentIds: string[];
  rows: ComparisonRow[];
  comparedAt: Date;
}

// ── API Request/Response Types ───────────────────────────────────────

export interface ChatRequest {
  question: string;
  documentIds: string[];
}

export interface ChatStreamEvent {
  type: "text_delta" | "citation" | "done" | "error";
  data: string;
}

export interface ExtractRequest {
  documentId: string;
  extractionType: ExtractionType;
}

export interface ExtractResponse {
  success: boolean;
  result?: ExtractionResult;
  error?: string;
}

export interface CompareRequest {
  documentIds: string[];
  extractionType: ExtractionType;
}

export interface CompareResponse {
  success: boolean;
  result?: ComparisonResult;
  error?: string;
}
