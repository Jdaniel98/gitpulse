import { NextRequest, NextResponse } from "next/server";
import { insertContribution, getContributions, deleteContribution, deleteContributions } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import type { ContributionInsert } from "@/lib/types";

export async function GET(request: NextRequest) {
  const result = await requireAuth();
  if (result instanceof NextResponse) return result;
  const { userId } = result;

  const params = request.nextUrl.searchParams;
  const options = {
    limit: params.get("limit") ? Number(params.get("limit")) : 50,
    offset: params.get("offset") ? Number(params.get("offset")) : 0,
    type: params.get("type") || undefined,
    repo: params.get("repo") || undefined,
    search: params.get("search") || undefined,
    startDate: params.get("startDate") || undefined,
    endDate: params.get("endDate") || undefined,
  };

  const data = getContributions(userId, options);
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const result = await requireAuth();
  if (result instanceof NextResponse) return result;
  const { userId } = result;

  const body = await request.json();
  const data: ContributionInsert = {
    type: body.type,
    title: body.title,
    description: body.description,
    repo: body.repo,
    url: body.url,
    source: body.source || "manual",
    github_id: body.github_id,
    created_at: body.created_at || new Date().toISOString(),
    synced_at: body.synced_at,
  };

  const contribution = insertContribution(data, userId);
  return NextResponse.json(contribution, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const result = await requireAuth();
  if (result instanceof NextResponse) return result;
  const { userId } = result;

  const body = await request.json();

  // Bulk delete
  if (body.ids && Array.isArray(body.ids)) {
    const count = deleteContributions(body.ids, userId);
    return NextResponse.json({ success: true, deleted: count });
  }

  // Single delete
  const deleted = deleteContribution(body.id, userId);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
