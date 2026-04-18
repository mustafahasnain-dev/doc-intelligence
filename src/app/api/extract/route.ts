import { NextRequest, NextResponse } from "next/server";
import { extractStructured } from "@/lib/claude";
import type { DocumentChunk, ExtractionField, ExtractionResult } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { documentId, extractionType, chunks } = body as {
      documentId: string;
      extractionType: string;
      chunks: DocumentChunk[];
    };

    if (!documentId || !extractionType || !chunks?.length) {
      return NextResponse.json(
        { error: "documentId, extractionType, and chunks are required" },
        { status: 400 }
      );
    }

    const rawResponse = await extractStructured(chunks, extractionType);

    // Parse the JSON from Claude's response
    let fields: ExtractionField[] = [];
    try {
      // Try to find JSON array in the response
      const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        fields = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // If parsing fails, return raw response
    }

    const result: ExtractionResult = {
      id: crypto.randomUUID(),
      documentId,
      extractionType: extractionType as ExtractionResult["extractionType"],
      fields,
      rawResponse,
      extractedAt: new Date(),
    };

    return NextResponse.json({ success: true, result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
