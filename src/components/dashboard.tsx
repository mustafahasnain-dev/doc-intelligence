"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { DocumentList } from "@/components/document-list";
import { ChatPanel } from "@/components/chat-panel";
import { ExtractionPanel } from "@/components/extraction-panel";
import { ComparisonTable } from "@/components/comparison-table";
import { UploadZone } from "@/components/upload-zone";
import { FileSearch, MessageSquare, LayoutGrid, Columns3, Menu, X } from "lucide-react";

export default function Dashboard() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-70 border-r border-border/50 bg-linear-to-b from-background to-muted/40 flex flex-col shrink-0 shadow-[1px_0_12px_-4px_rgba(0,0,0,0.06)] transition-transform duration-200 lg:static lg:z-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand */}
        <div className="px-5 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center shadow-md">
              <FileSearch className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight">DocIntel</span>
              <p className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">AI Intelligence</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden h-7 w-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <Separator className="opacity-50" />
        <DocumentList onUploadClick={() => setUploadOpen(true)} />
      </aside>

      {/* Main workspace */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md gradient-primary flex items-center justify-center">
              <FileSearch className="h-3 w-3 text-white" />
            </div>
            <span className="font-semibold text-sm">DocIntel</span>
          </div>
        </div>

        <Tabs defaultValue="chat" className="flex flex-col h-full">
          {/* Tab navigation */}
          <div className="border-b border-border/50 px-3 sm:px-4 pt-2 bg-linear-to-r from-background to-muted/20">
            <TabsList className="h-10 sm:h-11 bg-muted/50 rounded-lg p-1 gap-1 w-full sm:w-auto">
              <TabsTrigger
                value="chat"
                className="flex-1 sm:flex-initial gap-1.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm px-3 sm:px-4 text-xs font-medium transition-all"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Chat
              </TabsTrigger>
              <TabsTrigger
                value="extraction"
                className="flex-1 sm:flex-initial gap-1.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm px-3 sm:px-4 text-xs font-medium transition-all"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Extraction</span>
                <span className="sm:hidden">Extract</span>
              </TabsTrigger>
              <TabsTrigger
                value="compare"
                className="flex-1 sm:flex-initial gap-1.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm px-3 sm:px-4 text-xs font-medium transition-all"
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
