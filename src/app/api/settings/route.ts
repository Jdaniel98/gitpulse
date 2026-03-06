import { NextRequest, NextResponse } from "next/server";
import { getAllUserSettings, setUserSetting, getUserSetting } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { validateToken } from "@/lib/github";

export async function GET() {
  const result = await requireAuth();
  if (result instanceof NextResponse) return result;
  const { userId } = result;

  const settings = getAllUserSettings(userId);
  // Don't expose the full token
  if (settings.github_token) {
    settings.github_token = "•".repeat(8) + settings.github_token.slice(-4);
  }
  return NextResponse.json(settings);
}

export async function POST(request: NextRequest) {
  const result = await requireAuth();
  if (result instanceof NextResponse) return result;
  const { userId } = result;

  const body = await request.json();

  if (body.github_token) {
    // Validate token first
    const tokenResult = await validateToken(body.github_token);
    if (!tokenResult.valid) {
      return NextResponse.json({ error: "Invalid GitHub token" }, { status: 400 });
    }
    setUserSetting(userId, "github_token", body.github_token);
    if (tokenResult.username) {
      setUserSetting(userId, "github_username", tokenResult.username);
    }
    if (tokenResult.avatar) {
      setUserSetting(userId, "github_avatar", tokenResult.avatar);
    }
    return NextResponse.json({
      success: true,
      username: tokenResult.username,
      avatar: tokenResult.avatar,
    });
  }

  // Generic setting update
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === "string") {
      setUserSetting(userId, key, value);
    }
  }

  return NextResponse.json({ success: true });
}
