import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { publishPost } from "@/lib/github";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const content = formData.get("content") as string;
  const tagsRaw = formData.get("tags") as string | null;

  if (!content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const tags = tagsRaw
    ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  // Collect media files (base64 encoded)
  const mediaFiles: Array<{ name: string; base64: string }> = [];
  const entries = Array.from(formData.entries());
  for (const [key, value] of entries) {
    if (key === "media" && value instanceof File) {
      const arrayBuffer = await value.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      mediaFiles.push({ name: value.name, base64 });
    }
  }

  const post = await publishPost(
    session.accessToken,
    session.username,
    content.trim(),
    tags,
    mediaFiles
  );

  return NextResponse.json(post, { status: 201 });
}
