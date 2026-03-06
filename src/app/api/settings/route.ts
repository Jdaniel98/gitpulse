import { NextRequest, NextResponse } from "next/server";
import { getAllSettings, setSetting, getSetting } from "@/lib/db";
import { validateToken } from "@/lib/github";

export async function GET() {
  const settings = getAllSettings();
  // Don't expose the full token
  if (settings.github_token) {
    settings.github_token = "•".repeat(8) + settings.github_token.slice(-4);
  }
  return NextResponse.json(settings);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (body.github_token) {
    // Validate token first
    const result = await validateToken(body.github_token);
    if (!result.valid) {
      return NextResponse.json({ error: "Invalid GitHub token" }, { status: 400 });
    }
    setSetting("github_token", body.github_token);
    if (result.username) {
      setSetting("github_username", result.username);
    }
    if (result.avatar) {
      setSetting("github_avatar", result.avatar);
    }
    return NextResponse.json({
      success: true,
      username: result.username,
      avatar: result.avatar,
    });
  }

  // Generic setting update
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === "string") {
      setSetting(key, value);
    }
  }

  return NextResponse.json({ success: true });
}
