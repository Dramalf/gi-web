import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getProfile, getFollowing, getUserFeed } from "@/lib/github";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { username } = await params;

  const [profile, following, posts] = await Promise.all([
    getProfile(session.accessToken, username),
    getFollowing(session.accessToken, username),
    getUserFeed(session.accessToken, username, 30),
  ]);

  if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({ profile, following, posts });
}
