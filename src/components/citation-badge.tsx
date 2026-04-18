"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Citation } from "@/lib/types";

interface CitationBadgeProps {
  citation: Citation;
  index: number;
}

export function CitationBadge({ citation, index }: CitationBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge
            variant="outline"
            className="text-[10px] cursor-help bg-primary/8 text-primary border-primary/20 hover:bg-primary/15 transition-colors"
          >
            [{index + 1}] p.{citation.pageNumber}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs rounded-lg shadow-md">
          <p className="font-medium mb-1">
            Page {citation.pageNumber}
          </p>
          <p className="text-muted-foreground line-clamp-4">
            {citation.snippet}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
