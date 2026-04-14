"use client";
import { useState } from "react";

interface Props {
  username: string;
  initialFollowing: boolean;
  onToggle?: (isFollowing: boolean) => void;
}

export function FollowButton({ username, initialFollowing, onToggle }: Props) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [hovered, setHovered] = useState(false);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const action = isFollowing ? "unfollow" : "follow";
    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, action }),
      });
      if (res.ok) {
        const next = !isFollowing;
        setIsFollowing(next);
        onToggle?.(next);
      }
    } finally {
      setLoading(false);
    }
  }

  if (isFollowing) {
    return (
      <button
        onClick={toggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        disabled={loading}
        className={`
          min-w-[96px] px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors
          ${hovered
            ? "border-red-300 text-red-500 bg-red-50"
            : "border-gray-300 text-gray-900 bg-white"
          }
          disabled:opacity-50
        `}
      >
        {loading ? "…" : hovered ? "Unfollow" : "Following"}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="min-w-[96px] px-4 py-1.5 rounded-full text-sm font-semibold bg-gray-900 text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
    >
      {loading ? "…" : "Follow"}
    </button>
  );
}
