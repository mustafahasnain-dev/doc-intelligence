"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDocumentStore } from "@/store/document-store";
import { useChatStore } from "@/store/chat-store";
import { useChatStream } from "@/hooks/use-chat-stream";
import { CitationBadge } from "@/components/citation-badge";
import { formatMessage } from "@/lib/format-message";

export function ChatPanel() {
  const selectedIds = useDocumentStore((s) => s.selectedDocumentIds);
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const streamError = useChatStore((s) => s.streamError);
  const { send } = useChatStream();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const hasDocuments = selectedIds.length > 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 0);
    return () => clearTimeout(timer);
  }, [messages, isStreaming]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    send(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/50">
        <div className="h-6 w-6 rounded-md gradient-primary flex items-center justify-center">
          <Sparkles className="h-3 w-3 text-white" />
        </div>
        <h3 className="text-sm font-semibold">AI Chat</h3>
        {hasDocuments && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {selectedIds.length} doc{selectedIds.length > 1 ? "s" : ""} selected
          </span>
        )}
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 overflow-hidden">
        <div ref={scrollAreaRef} className="px-3 sm:px-5">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center animate-fade-in-up">
              <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg mb-4">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-medium">
                {hasDocuments
                  ? "Ask a question about your documents"
                  : "Select a document to start chatting"}
              </p>
              <p className="text-xs text-muted-foreground mt-1.5 max-w-xs">
                {hasDocuments
                  ? 'Try: "What are the key terms?" or "Summarize this document."'
                  : "Upload and select documents from the sidebar first."}
              </p>
            </div>
          ) : (
            <div className="space-y-5 py-5">
              {messages.map((msg, idx) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 animate-fade-in-up ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                  style={{ animationDelay: `${Math.min(idx * 0.05, 0.3)}s` }}
                >
                  {msg.role === "assistant" && (
                    <div className="h-7 w-7 rounded-full gradient-primary flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <Sparkles className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "gradient-primary text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-md"
                        : "bg-card border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm"
                    }`}
                  >
                    <div className={msg.role === "assistant" ? "space-y-0.5" : "whitespace-pre-wrap"}>
                      {msg.role === "assistant" ? formatMessage(msg.content) : msg.content}
                    </div>
                    {msg.citations.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5 pt-2.5 border-t border-border/30">
                        {msg.citations.map((c, i) => (
                          <CitationBadge key={c.chunkId} citation={c} index={i} />
                        ))}
                      </div>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5 border border-border/50">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {isStreaming && messages[messages.length - 1]?.content === "" && (
                <div className="flex justify-start gap-2.5">
                  <div className="h-7 w-7 rounded-full gradient-primary flex items-center justify-center shrink-0 animate-pulse-ring">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="bg-card border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.15s]" />
                      <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.3s]" />
                    </div>
                  </div>
                </div>
              )}
              {streamError && (
                <div className="flex justify-start gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="h-3.5 w-3.5 text-destructive" />
                  </div>
                  <div className="bg-destructive/5 border border-destructive/20 text-destructive rounded-2xl rounded-tl-sm px-4 py-3 text-sm">
                    Error: {streamError}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="border-t border-border/50 p-3 sm:p-4 bg-linear-to-t from-muted/30 to-transparent">
        <div className="flex gap-2 items-end bg-card rounded-xl border border-border/50 shadow-sm p-2 transition-shadow focus-within:shadow-md focus-within:border-primary/30">
          <Textarea
            placeholder={
              hasDocuments
                ? "Ask a question about your documents..."
                : "Select documents first..."
            }
            disabled={!hasDocuments || isStreaming}
            className="border-0 shadow-none focus-visible:ring-0 min-h-11 max-h-30 resize-none bg-transparent"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button
            size="icon"
            disabled={!hasDocuments || isStreaming || !input.trim()}
            className="shrink-0 h-9 w-9 rounded-lg gradient-primary text-white shadow-sm hover:shadow-md transition-all disabled:opacity-40"
            onClick={handleSend}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
