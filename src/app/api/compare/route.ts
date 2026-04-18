import { NextRequest, NextResponse } from "next/server";
import { compareDocuments } from "@/lib/claude";
import type { ComparisonRow, ComparisonResult } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { documentIds, extractions } = body as {
      documentIds: string[];
      extractions: {
        documentId: string;
        fields: { key: string; label: string; value: string | number | null }[];
      }[];
    };

    if (!documentIds?.length || documentIds.length < 2 || !extractions?.length) {
      return NextResponse.json(
        {
          error:
            "At least 2 documentIds and their extractions are required",
        },
        { status: 400 }
      );
    }

    const rawResponse = await compareDocuments(extractions);

    let rows: ComparisonRow[] = [];
    try {
      const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        rows = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // If parsing fails, build rows from extractions directly
      const allFields = new Map<string, { label: string; values: Record<string, string | number | null> }>();
      for (const ext of extractions) {
        for (const field of ext.fields) {
          if (!allFields.has(field.key)) {
            allFields.set(field.key, { label: field.label, values: {} });
          }
          allFields.get(field.key)!.values[ext.documentId] = field.value;
        }
      }
      rows = Array.from(allFields.entries()).map(([key, { label, values }]) => {
        const vals = Object.values(values);
        const isDifferent = vals.some((v) => v !== vals[0]);
        return { field: key, label, values, isDifferent };
      });
    }

    const result: ComparisonResult = {
      documentIds,
      rows,
      comparedAt: new Date(),
    };

    return NextResponse.json({ success: true, result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
