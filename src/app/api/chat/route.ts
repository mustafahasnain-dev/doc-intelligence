import { NextRequest, NextResponse } from "next/server";
import { streamChat } from "@/lib/claude";
import type { DocumentChunk } from "@/lib/types";

// In-memory chunk store (populated by the client via POST body)
// In a production app, you'd store chunks server-side; here the client sends them.

export async function POST(req: NextRequest) {
  try {
    // Validate API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY is not set in environment");
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

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
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Chat API error:", errorMessage, err);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
