import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { repoExists, initRepo } from "@/lib/github";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { accessToken, username } = session;

  const exists = await repoExists(accessToken, username);
  if (exists) return NextResponse.json({ status: "exists" });

  await initRepo(accessToken, username);
  return NextResponse.json({ status: "created" });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const exists = await repoExists(session.accessToken, session.username);
  return NextResponse.json({ exists });
}
