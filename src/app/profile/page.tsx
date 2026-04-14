"use client";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PostCard } from "@/components/PostCard";
import { BottomNav } from "@/components/BottomNav";
import type { FeedPost } from "@/lib/types";

interface ProfileData {
  profile: {
    display_name: string;
    bio: string;
    avatar: string;
    website: string;
  };
  following: string[];
  posts: FeedPost[];
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch(`/api/profile/${session.username}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [status, session?.username]);

  if (status === "loading" || status === "unauthenticated") return null;

  return (
    <div className="pb-16 min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 h-12 flex items-center justify-between">
        <span className="font-semibold text-gray-900">@{session?.username}</span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-gray-400 text-sm active:opacity-70"
        >
          Sign out
        </button>
      </header>

      {loading ? (
        <div className="px-4 pt-6 animate-pulse space-y-4">
          <div className="flex gap-4 items-center">
            <div className="w-16 h-16 rounded-full bg-gray-200" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-48 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      ) : data ? (
        <>
          {/* Profile info */}
          <div className="px-4 pt-5 pb-4 border-b border-gray-100">
            <div className="flex items-start gap-4">
              <Image
                src={data.profile.avatar}
                alt={data.profile.display_name}
                width={64}
                height={64}
                className="rounded-full w-16 h-16 object-cover"
              />
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-gray-900 text-lg leading-tight">
                  {data.profile.display_name}
                </h2>
                {data.profile.bio && (
                  <p className="text-sm text-gray-600 mt-1 leading-snug">{data.profile.bio}</p>
                )}
                {data.profile.website && (
                  <a
                    href={data.profile.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-brand mt-1 block truncate"
                  >
                    {data.profile.website}
                  </a>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 mt-4">
              <div className="text-center">
                <span className="font-bold text-gray-900 text-base">{data.posts.length}</span>
                <p className="text-xs text-gray-400 mt-0.5">Posts</p>
              </div>
              <div className="text-center">
                <span className="font-bold text-gray-900 text-base">{data.following.length}</span>
                <p className="text-xs text-gray-400 mt-0.5">Following</p>
              </div>
            </div>
          </div>

          {/* Posts */}
          <div>
            {data.posts.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-sm">No posts yet</div>
            ) : (
              data.posts.map((post) => <PostCard key={post.id} post={post} />)
            )}
          </div>
        </>
      ) : (
        <div className="py-16 text-center text-gray-400 text-sm">
          Profile not found. <button onClick={() => router.push("/")} className="text-brand">Go home</button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
