"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { PostCard } from "@/components/PostCard";
import { BottomNav } from "@/components/BottomNav";
import type { FeedPost } from "@/lib/types";

function Skeleton() {
  return (
    <div className="bg-white border-b border-gray-100 px-4 py-3 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gray-200" />
        <div className="space-y-1.5">
          <div className="h-3 w-24 bg-gray-200 rounded" />
          <div className="h-2.5 w-16 bg-gray-100 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full bg-gray-100 rounded" />
        <div className="h-3 w-3/4 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

export default function FeedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/feed?limit=30");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
      } else {
        setPosts(data);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    // Check & auto-init social repo on first load
    async function bootstrap() {
      const res = await fetch("/api/init");
      const { exists } = await res.json();
      if (!exists) {
        setInitializing(true);
        await fetch("/api/init", { method: "POST" });
        setInitializing(false);
      }
      loadFeed();
    }

    bootstrap();
  }, [status, loadFeed]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-16">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 h-12 flex items-center gap-3">
        {searchOpen ? (
          <>
            <input
              ref={searchRef}
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchValue.trim()) {
                  router.push(`/u/${searchValue.trim()}`);
                  setSearchValue("");
                  setSearchOpen(false);
                }
                if (e.key === "Escape") { setSearchOpen(false); setSearchValue(""); }
              }}
              placeholder="Search by GitHub username…"
              className="flex-1 text-sm outline-none placeholder-gray-400"
              autoFocus
            />
            <button onClick={() => { setSearchOpen(false); setSearchValue(""); }} className="text-gray-400 text-sm">
              Cancel
            </button>
          </>
        ) : (
          <>
            <span className="font-bold text-lg tracking-tight text-gray-900 flex-1">gi</span>
            <button onClick={() => setSearchOpen(true)} className="text-gray-500 active:opacity-70 p-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
            <button onClick={loadFeed} className="text-gray-500 active:opacity-70 p-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>
          </>
        )}
      </header>

      {/* Initializing banner */}
      {initializing && (
        <div className="bg-brand text-white text-xs text-center py-2 px-4">
          Setting up your social repo on GitHub…
        </div>
      )}

      {/* Feed */}
      <main>
        {loading ? (
          <>
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </>
        ) : error ? (
          <div className="p-6 text-sm text-red-500 bg-red-50 m-4 rounded-xl">{error}</div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-8">
            <p className="text-gray-500 text-sm">No posts yet.</p>
            <p className="text-gray-400 text-xs mt-1">
              Follow people or publish your first post.
            </p>
          </div>
        ) : (
          posts.map((post) => <PostCard key={`${post.author}-${post.id}`} post={post} />)
        )}
      </main>

      <BottomNav />
    </div>
  );
}
