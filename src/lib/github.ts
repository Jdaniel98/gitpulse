import { Octokit } from "octokit";
import type { ContributionInsert, ContributionType } from "./types";

export function createOctokit(token: string) {
  return new Octokit({ auth: token });
}

interface GitHubEvent {
  id: string;
  type: string;
  repo: { name: string };
  created_at: string;
  payload: Record<string, unknown>;
}

function mapEventToContribution(event: GitHubEvent): ContributionInsert | ContributionInsert[] | null {
  const base = {
    source: "github_api" as const,
    github_id: event.id,
    repo: event.repo.name,
    created_at: event.created_at,
    synced_at: new Date().toISOString(),
  };

  switch (event.type) {
    case "PushEvent": {
      const commits = (event.payload.commits as { sha: string; message: string }[]) || [];
      return commits.map((commit) => ({
        ...base,
        type: "commit" as ContributionType,
        title: commit.message.split("\n")[0].substring(0, 200),
        description: commit.message,
        url: `https://github.com/${event.repo.name}/commit/${commit.sha}`,
        github_id: `${event.id}_${commit.sha.substring(0, 7)}`,
      }));
    }
    case "PullRequestEvent": {
      const pr = event.payload.pull_request as { title: string; html_url: string; body: string };
      const action = event.payload.action as string;
      return {
        ...base,
        type: "pr" as ContributionType,
        title: `${action === "opened" ? "Opened" : action === "closed" ? "Closed" : action.charAt(0).toUpperCase() + action.slice(1)} PR: ${pr.title}`,
        description: pr.body?.substring(0, 500) || null,
        url: pr.html_url,
      } as ContributionInsert;
    }
    case "IssuesEvent": {
      const issue = event.payload.issue as { title: string; html_url: string; body: string };
      const action = event.payload.action as string;
      return {
        ...base,
        type: "issue" as ContributionType,
        title: `${action.charAt(0).toUpperCase() + action.slice(1)} issue: ${issue.title}`,
        description: issue.body?.substring(0, 500) || null,
        url: issue.html_url,
      } as ContributionInsert;
    }
    case "PullRequestReviewEvent": {
      const pr = event.payload.pull_request as { title: string; html_url: string };
      return {
        ...base,
        type: "review" as ContributionType,
        title: `Reviewed PR: ${pr.title}`,
        url: pr.html_url,
      } as ContributionInsert;
    }
    case "ForkEvent": {
      const forkee = event.payload.forkee as { full_name: string; html_url: string };
      return {
        ...base,
        type: "fork" as ContributionType,
        title: `Forked to ${forkee.full_name}`,
        url: forkee.html_url,
      } as ContributionInsert;
    }
    case "WatchEvent": {
      return {
        ...base,
        type: "star" as ContributionType,
        title: `Starred ${event.repo.name}`,
        url: `https://github.com/${event.repo.name}`,
      } as ContributionInsert;
    }
    case "IssueCommentEvent": {
      const issue = event.payload.issue as { title: string };
      const comment = event.payload.comment as { html_url: string; body: string };
      return {
        ...base,
        type: "review" as ContributionType,
        title: `Commented on: ${issue.title}`,
        description: comment.body?.substring(0, 500) || null,
        url: comment.html_url,
      } as ContributionInsert;
    }
    case "CreateEvent": {
      const refType = event.payload.ref_type as string;
      const ref = event.payload.ref as string;
      return {
        ...base,
        type: "commit" as ContributionType,
        title: `Created ${refType}${ref ? `: ${ref}` : ""} in ${event.repo.name}`,
        url: `https://github.com/${event.repo.name}`,
      } as ContributionInsert;
    }
    default:
      return null;
  }
}

export async function fetchGitHubEvents(token: string, username: string): Promise<ContributionInsert[]> {
  const octokit = createOctokit(token);
  const contributions: ContributionInsert[] = [];

  // Fetch up to 10 pages (300 events, GitHub's max)
  for (let page = 1; page <= 10; page++) {
    const { data: events } = await octokit.rest.activity.listEventsForAuthenticatedUser({
      username,
      per_page: 30,
      page,
    });

    if (events.length === 0) break;

    for (const event of events) {
      const mapped = mapEventToContribution(event as unknown as GitHubEvent);
      if (mapped) {
        if (Array.isArray(mapped)) {
          contributions.push(...mapped);
        } else {
          contributions.push(mapped);
        }
      }
    }
  }

  return contributions;
}

export async function validateToken(token: string): Promise<{ valid: boolean; username?: string; avatar?: string }> {
  try {
    const octokit = createOctokit(token);
    const { data } = await octokit.rest.users.getAuthenticated();
    return { valid: true, username: data.login, avatar: data.avatar_url };
  } catch {
    return { valid: false };
  }
}
