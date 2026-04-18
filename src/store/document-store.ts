import { create } from "zustand";
import type {
  UploadedDocument,
  DocumentChunk,
  ExtractionResult,
} from "@/lib/types";

interface DocumentState {
  // Data
  documents: UploadedDocument[];
  chunks: Record<string, DocumentChunk[]>; // documentId → chunks
  extractions: Record<string, ExtractionResult[]>; // documentId → results
  selectedDocumentIds: string[];

  // Loading
  isUploading: boolean;
  uploadError: string | null;

  // Actions
  addDocument: (doc: UploadedDocument, docChunks: DocumentChunk[]) => void;
  removeDocument: (id: string) => void;
  selectDocument: (id: string) => void;
  deselectDocument: (id: string) => void;
  toggleDocumentSelection: (id: string) => void;
  clearSelection: () => void;
  setUploading: (uploading: boolean) => void;
  setUploadError: (error: string | null) => void;
  addExtraction: (documentId: string, result: ExtractionResult) => void;
  getChunksForDocuments: (documentIds: string[]) => DocumentChunk[];
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  chunks: {},
  extractions: {},
  selectedDocumentIds: [],
  isUploading: false,
  uploadError: null,

  addDocument: (doc, docChunks) =>
    set((state) => ({
      documents: [...state.documents, doc],
      chunks: { ...state.chunks, [doc.id]: docChunks },
      selectedDocumentIds: [...state.selectedDocumentIds, doc.id],
    })),

  removeDocument: (id) =>
    set((state) => {
      const { [id]: _chunks, ...restChunks } = state.chunks;
      const { [id]: _extractions, ...restExtractions } = state.extractions;
      return {
        documents: state.documents.filter((d) => d.id !== id),
        chunks: restChunks,
        extractions: restExtractions,
        selectedDocumentIds: state.selectedDocumentIds.filter((d) => d !== id),
      };
    }),

  selectDocument: (id) =>
    set((state) => ({
      selectedDocumentIds: state.selectedDocumentIds.includes(id)
        ? state.selectedDocumentIds
        : [...state.selectedDocumentIds, id],
    })),

  deselectDocument: (id) =>
    set((state) => ({
      selectedDocumentIds: state.selectedDocumentIds.filter((d) => d !== id),
    })),

  toggleDocumentSelection: (id) =>
    set((state) => ({
      selectedDocumentIds: state.selectedDocumentIds.includes(id)
        ? state.selectedDocumentIds.filter((d) => d !== id)
        : [...state.selectedDocumentIds, id],
    })),

  clearSelection: () => set({ selectedDocumentIds: [] }),

  setUploading: (uploading) => set({ isUploading: uploading }),

  setUploadError: (error) => set({ uploadError: error }),

  addExtraction: (documentId, result) =>
    set((state) => ({
      extractions: {
        ...state.extractions,
        [documentId]: [...(state.extractions[documentId] || []), result],
      },
    })),

  getChunksForDocuments: (documentIds) => {
    const { chunks } = get();
    return documentIds.flatMap((id) => chunks[id] || []);
  },
}));
