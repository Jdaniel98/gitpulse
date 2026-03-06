import { NextRequest, NextResponse } from "next/server";
import { getContributionsForExport } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  const result = await requireAuth();
  if (result instanceof NextResponse) return result;
  const { userId } = result;

  const params = request.nextUrl.searchParams;
  const format = params.get("format") || "json";

  const data = getContributionsForExport(userId, {
    type: params.get("type") || undefined,
    repo: params.get("repo") || undefined,
    search: params.get("search") || undefined,
    startDate: params.get("startDate") || undefined,
    endDate: params.get("endDate") || undefined,
  });

  if (format === "csv") {
    const headers = ["id", "type", "title", "description", "repo", "url", "source", "created_at"];
    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((h) => {
            const val = row[h as keyof typeof row];
            if (val === null || val === undefined) return "";
            const str = String(val);
            return str.includes(",") || str.includes('"') || str.includes("\n")
              ? `"${str.replace(/"/g, '""')}"`
              : str;
          })
          .join(",")
      ),
    ];
    const csv = csvRows.join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="gitpulse-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="gitpulse-export-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
