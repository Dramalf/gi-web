"use client";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PostCard } from "@/components/PostCard";
import { FollowButton } from "@/components/FollowButton";
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

export default function UserPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;

  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [myFollowing, setMyFollowing] = useState<string[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    // Load target user's profile and own following list in parallel
    Promise.all([
      fetch(`/api/profile/${username}`).then(async (r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json() as Promise<ProfileData>;
      }),
      fetch(`/api/profile/${session.username}`).then((r) => r.json()),
    ]).then(([profileData, myData]) => {
      if (profileData) setData(profileData);
      if (myData?.following) setMyFollowing(myData.following);
    }).finally(() => setLoading(false));
  }, [status, username, session?.username]);

  if (status === "loading" || status === "unauthenticated") return null;

  const isOwnProfile = session?.username === username;
  const isFollowing = myFollowing.includes(username);

  return (
    <div className="pb-16 min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 h-12 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500 active:opacity-70 p-1 -ml-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">@{username}</p>
          {data && (
            <p className="text-gray-400 text-xs">{data.posts.length} posts</p>
          )}
        </div>
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
      ) : notFound ? (
        <div className="py-24 text-center space-y-2">
          <p className="text-gray-500 text-sm">@{username} doesn&apos;t have a social repo yet.</p>
        </div>
      ) : data ? (
        <>
          {/* Profile header */}
          <div className="px-4 pt-5 pb-4 border-b border-gray-100">
            <div className="flex items-start justify-between gap-4">
              <Image
                src={data.profile.avatar}
                alt={data.profile.display_name}
                width={72}
                height={72}
                className="rounded-full w-18 h-18 object-cover"
              />
              {/* Follow button — only shown on other people's profiles */}
              {!isOwnProfile && (
                <div className="mt-1">
                  <FollowButton
                    username={username}
                    initialFollowing={isFollowing}
                    onToggle={(following) =>
                      setMyFollowing((prev) =>
                        following ? [...prev, username] : prev.filter((u) => u !== username)
                      )
                    }
                  />
                </div>
              )}
            </div>

            <div className="mt-3">
              <h2 className="font-bold text-gray-900 text-lg leading-tight">
                {data.profile.display_name}
              </h2>
              <p className="text-gray-500 text-sm">@{username}</p>
              {data.profile.bio && (
                <p className="text-sm text-gray-800 mt-2 leading-snug">{data.profile.bio}</p>
              )}
              {data.profile.website && (
                <a
                  href={data.profile.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-brand mt-1 inline-flex items-center gap-1"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  {data.profile.website.replace(/^https?:\/\//, "")}
                </a>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-5 mt-3">
              <div>
                <span className="font-bold text-gray-900 text-sm">{data.posts.length}</span>
                <span className="text-gray-500 text-sm ml-1">Posts</span>
              </div>
              <div>
                <span className="font-bold text-gray-900 text-sm">{data.following.length}</span>
                <span className="text-gray-500 text-sm ml-1">Following</span>
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
      ) : null}

      <BottomNav />
    </div>
  );
}
