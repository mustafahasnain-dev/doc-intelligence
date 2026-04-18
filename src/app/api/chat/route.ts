import { NextRequest, NextResponse } from "next/server";
import { streamChat } from "@/lib/claude";
import type { DocumentChunk } from "@/lib/types";

// In-memory chunk store (populated by the client via POST body)
// In a production app, you'd store chunks server-side; here the client sends them.

export async function POST(req: NextRequest) {
  try {
    console.log("[CHAT] Request received");

    // Validate API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    console.log("[CHAT] API Key check:", apiKey ? "SET" : "NOT SET");
    if (!apiKey) {
      console.error("[CHAT] ANTHROPIC_API_KEY is not set in environment");
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    console.log("[CHAT] Parsing request body");
    const body = await req.json();
    const { question, chunks } = body as {
      question: string;
      chunks: DocumentChunk[];
    };
    console.log("[CHAT] Body parsed - question length:", question?.length, "chunks:", chunks?.length);

    if (!question || !chunks?.length) {
      console.error("[CHAT] Invalid input - question or chunks missing");
      return NextResponse.json(
        { error: "question and chunks are required" },
        { status: 400 }
      );
    }

    console.log("[CHAT] Starting stream...");
    const stream = streamChat(question, chunks);
    console.log("[CHAT] Stream created successfully");

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : "";
    console.error("[CHAT] ERROR:", errorMessage);
    console.error("[CHAT] STACK:", stack);
    console.error("[CHAT] Full error:", err);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
