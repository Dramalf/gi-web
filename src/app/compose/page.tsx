"use client";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BottomNav } from "@/components/BottomNav";

export default function ComposePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    // Auto-resize textarea
    if (textRef.current) {
      textRef.current.style.height = "auto";
      textRef.current.style.height = `${textRef.current.scrollHeight}px`;
    }
  }, [content]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (!content.trim()) return;
    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append("content", content.trim());
    if (tags.trim()) formData.append("tags", tags.trim());
    if (mediaFile) formData.append("media", mediaFile);

    try {
      const res = await fetch("/api/post", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
        return;
      }
      router.push("/");
    } catch {
      setError("Network error, please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading" || status === "unauthenticated") return null;

  const canPost = content.trim().length > 0 && !submitting;

  return (
    <div className="pb-16 min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 h-12 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="text-gray-500 text-sm active:opacity-70 flex items-center gap-1"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canPost}
          className="bg-brand text-white text-sm font-semibold px-4 py-1.5 rounded-full disabled:opacity-40 active:scale-95 transition-transform"
        >
          {submitting ? "Posting…" : "Post"}
        </button>
      </header>

      <div className="px-4 pt-4">
        {/* Author */}
        <div className="flex gap-3">
          {session?.user?.image && (
            <Image
              src={session.user.image}
              alt="avatar"
              width={40}
              height={40}
              className="rounded-full w-10 h-10 object-cover flex-shrink-0"
            />
          )}

          <div className="flex-1 min-w-0">
            {/* Text */}
            <textarea
              ref={textRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              maxLength={2000}
              rows={4}
              className="w-full resize-none text-base text-gray-900 placeholder-gray-400 outline-none leading-relaxed"
            />

            {/* Image preview */}
            {preview && (
              <div className="relative mt-3 rounded-xl overflow-hidden bg-gray-100">
                <img src={preview} alt="preview" className="w-full max-h-64 object-cover" />
                <button
                  onClick={() => { setMediaFile(null); setPreview(null); }}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Tags */}
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Tags (comma-separated, e.g. travel,photo)"
              className="mt-3 w-full text-sm text-gray-600 placeholder-gray-300 outline-none border-b border-gray-100 pb-2"
            />
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-brand flex items-center gap-1.5 text-sm font-medium active:opacity-70"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            Photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <span className="ml-auto text-xs text-gray-400">
            {content.length}/2000
          </span>
        </div>

        {/* Error */}
        {error && (
          <p className="mt-3 text-sm text-red-500 bg-red-50 rounded-xl p-3">{error}</p>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
