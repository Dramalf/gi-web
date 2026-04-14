"use client";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import type { FeedPost } from "@/lib/types";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Image grid layouts (Twitter-style) ──────────────────────────────────────

function MediaGrid({ urls }: { urls: string[] }) {
  if (urls.length === 0) return null;

  // 1 image — full width, natural ratio capped at 500px tall
  if (urls.length === 1) {
    return (
      <div className="mt-3 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
        <img
          src={urls[0]}
          alt="Post image"
          className="w-full object-cover max-h-[500px]"
          loading="lazy"
        />
      </div>
    );
  }

  // 2 images — side by side, square crop
  if (urls.length === 2) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-0.5 rounded-2xl overflow-hidden border border-gray-100">
        {urls.map((url, i) => (
          <div key={i} className="relative aspect-square bg-gray-50">
            <img src={url} alt={`Image ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
          </div>
        ))}
      </div>
    );
  }

  // 3 images — left: tall 2:3, right: two squares stacked
  if (urls.length === 3) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-0.5 rounded-2xl overflow-hidden border border-gray-100" style={{ height: 280 }}>
        <div className="relative bg-gray-50">
          <img src={urls[0]} alt="Image 1" className="w-full h-full object-cover" loading="lazy" />
        </div>
        <div className="grid grid-rows-2 gap-0.5">
          {urls.slice(1).map((url, i) => (
            <div key={i} className="relative bg-gray-50">
              <img src={url} alt={`Image ${i + 2}`} className="w-full h-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4 images — 2×2 grid, square crop
  return (
    <div className="mt-3 grid grid-cols-2 gap-0.5 rounded-2xl overflow-hidden border border-gray-100">
      {urls.slice(0, 4).map((url, i) => (
        <div key={i} className="relative aspect-square bg-gray-50">
          <img src={url} alt={`Image ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
        </div>
      ))}
    </div>
  );
}

// ─── Post card ────────────────────────────────────────────────────────────────

export function PostCard({ post }: { post: FeedPost }) {
  return (
    <article className="bg-white border-b border-gray-100 px-4 py-3">
      {/* Author row */}
      <div className="flex items-center gap-3 mb-2">
        <Link href={`/u/${post.author}`} className="flex-shrink-0">
          <Image
            src={post.authorAvatar}
            alt={post.author}
            width={40}
            height={40}
            className="rounded-full w-10 h-10 object-cover"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/u/${post.author}`}>
            <span className="font-semibold text-sm text-gray-900 hover:underline">
              @{post.author}
            </span>
          </Link>
          <span className="text-gray-400 text-xs ml-2">{relativeTime(post.createdAt)}</span>
        </div>
      </div>

      {/* Text */}
      <div className="text-sm text-gray-900 leading-relaxed prose prose-sm max-w-none
        prose-a:text-brand prose-a:no-underline hover:prose-a:underline
        prose-strong:text-gray-900 prose-p:my-1">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>

      {/* Images */}
      <MediaGrid urls={post.mediaUrls} />

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {post.tags.map((tag) => (
            <span key={tag} className="text-xs text-brand font-medium">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
