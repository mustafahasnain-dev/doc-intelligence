"use client";

import { useCallback } from "react";
import { useChatStore } from "@/store/chat-store";
import { useDocumentStore } from "@/store/document-store";
import type { ChatStreamEvent } from "@/lib/types";

export function useChatStream() {
  const addMessage = useChatStore((s) => s.addMessage);
  const appendToLastAssistantMessage = useChatStore(
    (s) => s.appendToLastAssistantMessage
  );
  const setStreaming = useChatStore((s) => s.setStreaming);
  const setStreamError = useChatStore((s) => s.setStreamError);
  const getChunksForDocuments = useDocumentStore(
    (s) => s.getChunksForDocuments
  );
  const selectedDocumentIds = useDocumentStore((s) => s.selectedDocumentIds);

  const send = useCallback(
    async (question: string) => {
      if (!question.trim() || selectedDocumentIds.length === 0) return;

      // Add user message
      addMessage({
        id: crypto.randomUUID(),
        role: "user",
        content: question.trim(),
        citations: [],
        timestamp: new Date(),
      });

      // Add empty assistant message to stream into
      addMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        citations: [],
        timestamp: new Date(),
      });

      setStreaming(true);
      setStreamError(null);

      try {
        const chunks = getChunksForDocuments(selectedDocumentIds);

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: question.trim(), chunks }),
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE lines
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;
            const jsonStr = trimmed.slice(6);

            try {
              const event: ChatStreamEvent = JSON.parse(jsonStr);
              if (event.type === "text_delta") {
                appendToLastAssistantMessage(event.data);
              } else if (event.type === "error") {
                setStreamError(event.data);
              }
            } catch {
              // skip malformed SSE
            }
          }
        }
      } catch (err) {
        setStreamError(
          err instanceof Error ? err.message : "Failed to send message"
        );
      } finally {
        setStreaming(false);
      }
    },
    [
      selectedDocumentIds,
      addMessage,
      appendToLastAssistantMessage,
      setStreaming,
      setStreamError,
      getChunksForDocuments,
    ]
  );

  return { send };
}
