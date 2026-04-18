import type { DocumentChunk } from "@/lib/types";

let pdfjsInitialized = false;

async function getPdfjs() {
  const pdfjsLib = await import("pdfjs-dist");
  if (!pdfjsInitialized) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";
    pdfjsInitialized = true;
  }
  return pdfjsLib;
}

export async function extractTextFromPDF(
  file: File,
  documentId: string
): Promise<{ chunks: DocumentChunk[]; totalPages: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = await getPdfjs();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;
  const allChunks: DocumentChunk[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Rebuild readable text from text items
    let pageText = "";
    let lastY: number | null = null;
    for (const item of textContent.items) {
      if ("str" in item) {
        const y = (item as { transform: number[] }).transform[5];
        if (lastY !== null && Math.abs(y - lastY) > 2) {
          pageText += "\n";
        }
        pageText += item.str;
        lastY = y;
      }
    }

    const pageChunks = chunkText(pageText, documentId, pageNum);
    allChunks.push(...pageChunks);
  }

  return { chunks: allChunks, totalPages };
}

export function chunkText(
  text: string,
  documentId: string,
  pageNumber: number,
  maxChunkSize: number = 500
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  const paragraphs = text.split(/\n\s*\n/);
  let charOffset = 0;
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) {
      charOffset += paragraph.length + 1;
      continue;
    }

    // Split long paragraphs
    if (trimmed.length > maxChunkSize) {
      const sentences = trimmed.match(/[^.!?]+[.!?]+/g) || [trimmed];
      let buffer = "";
      let bufferStart = charOffset;

      for (const sentence of sentences) {
        if (buffer.length + sentence.length > maxChunkSize && buffer.length > 0) {
          chunks.push({
            id: `${documentId}-p${pageNumber}-c${chunkIndex}`,
            documentId,
            pageNumber,
            chunkIndex,
            text: buffer.trim(),
            charStart: bufferStart,
            charEnd: bufferStart + buffer.length,
          });
          chunkIndex++;
          buffer = sentence;
          bufferStart = charOffset;
        } else {
          buffer += sentence;
        }
        charOffset += sentence.length;
      }

      if (buffer.trim()) {
        chunks.push({
          id: `${documentId}-p${pageNumber}-c${chunkIndex}`,
          documentId,
          pageNumber,
          chunkIndex,
          text: buffer.trim(),
          charStart: bufferStart,
          charEnd: bufferStart + buffer.length,
        });
        chunkIndex++;
      }
    } else {
      chunks.push({
        id: `${documentId}-p${pageNumber}-c${chunkIndex}`,
        documentId,
        pageNumber,
        chunkIndex,
        text: trimmed,
        charStart: charOffset,
        charEnd: charOffset + trimmed.length,
      });
      chunkIndex++;
      charOffset += paragraph.length + 1;
    }
  }

  return chunks;
}

/** Create chunks from raw pasted text (treated as single page). */
export function createChunksFromText(
  text: string,
  documentId: string
): DocumentChunk[] {
  return chunkText(text, documentId, 1);
}

/** Parse a PDF file and return document metadata with extracted chunks. */
export async function parsePDF(
  file: File,
  description?: string
): Promise<{ document: any; chunks: DocumentChunk[] }> {
  // Generate ID from filename + random suffix
  const nameWithoutExt = file.name.replace(/\.[^\/\.]+$/, "");
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const id = `${nameWithoutExt}_${randomSuffix}`;

  // Extract text and chunks
  const { chunks, totalPages } = await extractTextFromPDF(file, id);

  // Create document object
  const document = {
    id,
    name: file.name,
    type: "pdf" as const,
    uploadedAt: new Date(),
    totalPages,
    totalChunks: chunks.length,
    sizeBytes: file.size,
    description,
  };

  return { document, chunks };
}
