"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { DocumentList } from "@/components/document-list";
import { ChatPanel } from "@/components/chat-panel";
import { ExtractionPanel } from "@/components/extraction-panel";
import { ComparisonTable } from "@/components/comparison-table";
import { UploadZone } from "@/components/upload-zone";
import { FileSearch, MessageSquare, LayoutGrid, Columns3 } from "lucide-react";

export default function Dashboard() {
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="w-70 border-r border-border/50 bg-linear-to-b from-background to-muted/40 flex flex-col shrink-0 shadow-[1px_0_12px_-4px_rgba(0,0,0,0.06)]">
        {/* Brand */}
        <div className="px-5 py-5 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center shadow-md">
            <FileSearch className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight">DocIntel</span>
            <p className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">AI Intelligence</p>
          </div>
        </div>
        <Separator className="opacity-50" />
        <DocumentList onUploadClick={() => setUploadOpen(true)} />
      </aside>

      {/* Main workspace */}
      <main className="flex-1 flex flex-col min-w-0">
        <Tabs defaultValue="chat" className="flex flex-col h-full">
          {/* Tab navigation */}
          <div className="border-b border-border/50 px-4 pt-2 bg-linear-to-r from-background to-muted/20">
            <TabsList className="h-11 bg-muted/50 rounded-lg p-1 gap-1">
              <TabsTrigger
                value="chat"
                className="gap-1.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 text-xs font-medium transition-all"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Chat
              </TabsTrigger>
              <TabsTrigger
                value="extraction"
                className="gap-1.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 text-xs font-medium transition-all"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Extraction
              </TabsTrigger>
              <TabsTrigger
                value="compare"
                className="gap-1.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 text-xs font-medium transition-all"
              >
                <Columns3 className="h-3.5 w-3.5" />
                Compare
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab content */}
          <TabsContent value="chat" className="flex-1 m-0 overflow-hidden">
            <ChatPanel />
          </TabsContent>
          <TabsContent value="extraction" className="flex-1 m-0 overflow-hidden">
            <ExtractionPanel />
          </TabsContent>
          <TabsContent value="compare" className="flex-1 m-0 overflow-hidden">
            <ComparisonTable />
          </TabsContent>
        </Tabs>
      </main>

      {/* Upload modal */}
      <UploadZone open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
