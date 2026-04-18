import { NextRequest, NextResponse } from "next/server";
import { streamChat } from "@/lib/claude";
import type { DocumentChunk } from "@/lib/types";

// In-memory chunk store (populated by the client via POST body)
// In a production app, you'd store chunks server-side; here the client sends them.

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, chunks } = body as {
      question: string;
      chunks: DocumentChunk[];
    };

    if (!question || !chunks?.length) {
      return NextResponse.json(
        { error: "question and chunks are required" },
        { status: 400 }
      );
    }

    const stream = streamChat(question, chunks);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
