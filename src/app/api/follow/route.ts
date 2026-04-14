import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { getFollowing, setFollowing, REPO_NAME } from "@/lib/github";
import { Octokit } from "@octokit/rest";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { username, action } = (await req.json()) as { username: string; action: "follow" | "unfollow" };

  if (!username || !action) {
    return NextResponse.json({ error: "username and action required" }, { status: 400 });
  }
  if (username === session.username) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
  }

  // Verify target has a social repo
  if (action === "follow") {
    const octokit = new Octokit({ auth: session.accessToken });
    try {
      await octokit.repos.get({ owner: username, repo: REPO_NAME });
    } catch {
      return NextResponse.json({ error: `@${username} does not have a social repo` }, { status: 404 });
    }
  }

  const list = await getFollowing(session.accessToken, session.username);

  let next: string[];
  if (action === "follow") {
    next = list.includes(username) ? list : [...list, username];
  } else {
    next = list.filter((u) => u !== username);
  }

  await setFollowing(session.accessToken, session.username, next);
  return NextResponse.json({ following: next });
}
