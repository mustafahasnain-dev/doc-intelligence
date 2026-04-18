import Anthropic from "@anthropic-ai/sdk";
import type { DocumentChunk } from "@/lib/types";
import { SYSTEM_PROMPTS } from "@/lib/prompts";

// Use Haiku everywhere for cost optimization
export const CLAUDE_CHAT = "claude-haiku-4-5-20251001";
export const CLAUDE_EXTRACT = "claude-haiku-4-5-20251001";

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey });
}

function buildChunkContext(chunks: DocumentChunk[]): string {
  return chunks
    .map(
      (c) =>
        `[${c.id}] (Page ${c.pageNumber}):\n${c.text}`
    )
    .join("\n\n---\n\n");
}

/** Stream a document Q&A response. Returns a ReadableStream of SSE lines. */
export function streamChat(
  question: string,
  chunks: DocumentChunk[]
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const client = getClient();
  const context = buildChunkContext(chunks);

  return new ReadableStream({
    async start(controller) {
      try {
        const stream = await client.messages.stream({
          model: CLAUDE_CHAT,
          max_tokens: 2048,
          system: SYSTEM_PROMPTS.documentQA,
          messages: [
            {
              role: "user",
              content: `Here are the relevant document chunks:\n\n${context}\n\n---\n\nQuestion: ${question}`,
            },
          ],
        });

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const data = JSON.stringify({
              type: "text_delta",
              data: event.delta.text,
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        }

        // Send done event
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "done", data: "" })}\n\n`
          )
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", data: msg })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });
}

/** Extract structured data from document text. */
export async function extractStructured(
  chunks: DocumentChunk[],
  extractionType: string
): Promise<string> {
  const client = getClient();
  const context = buildChunkContext(chunks);

  const response = await client.messages.create({
    model: CLAUDE_EXTRACT,
    max_tokens: 4096,
    system: SYSTEM_PROMPTS.extraction,
    messages: [
      {
        role: "user",
        content: `Extract ${extractionType} data from these document chunks. Return a JSON array of objects with keys: "key", "label", "value", "confidence" (one of "high", "medium", "low"). Only return valid JSON, no other text.\n\n${context}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock ? textBlock.text : "[]";
}

/** Compare extracted data across multiple documents. */
export async function compareDocuments(
  extractions: { documentId: string; fields: { key: string; label: string; value: string | number | null }[] }[]
): Promise<string> {
  const client = getClient();

  const context = extractions
    .map(
      (e) =>
        `Document ${e.documentId}:\n${e.fields
          .map((f) => `  ${f.label}: ${f.value ?? "N/A"}`)
          .join("\n")}`
    )
    .join("\n\n");

  const response = await client.messages.create({
    model: CLAUDE_EXTRACT,
    max_tokens: 4096,
    system: SYSTEM_PROMPTS.comparison,
    messages: [
      {
        role: "user",
        content: `Compare these document extractions and return a JSON array of comparison rows. Each row should have: "field" (key), "label", "values" (object mapping documentId to value), "isDifferent" (boolean). Only return valid JSON.\n\n${context}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock ? textBlock.text : "[]";
}
