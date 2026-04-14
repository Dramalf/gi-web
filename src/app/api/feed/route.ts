import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { getFeed, getUserFeed } from "@/lib/github";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const limit = parseInt(searchParams.get("limit") ?? "30", 10);
  const user = searchParams.get("user");

  try {
    const posts = user
      ? await getUserFeed(session.accessToken, user, limit)
      : await getFeed(session.accessToken, session.username, limit);
    return NextResponse.json(posts);
  } catch (e) {
    console.error("[feed] error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
