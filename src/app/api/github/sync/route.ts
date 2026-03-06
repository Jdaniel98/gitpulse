import { NextResponse } from "next/server";
import { getSetting, insertContributions, hasGithubId } from "@/lib/db";
import { fetchGitHubEvents } from "@/lib/github";

export async function POST() {
  const token = getSetting("github_token");
  const username = getSetting("github_username");

  if (!token || !username) {
    return NextResponse.json(
      { error: "GitHub token and username not configured. Go to Settings to set them up." },
      { status: 400 }
    );
  }

  try {
    const events = await fetchGitHubEvents(token, username);

    // Filter out already-synced events
    const newEvents = events.filter(
      (e) => !e.github_id || !hasGithubId(e.github_id)
    );

    const inserted = insertContributions(newEvents);

    return NextResponse.json({
      fetched: events.length,
      new: inserted,
      message: `Synced ${inserted} new contributions from GitHub.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `GitHub sync failed: ${message}` }, { status: 500 });
  }
}
