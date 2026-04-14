"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function UserIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 max-w-lg mx-auto">
      <div className="flex items-center justify-around h-14 px-4">
        <Link
          href="/"
          className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-colors ${
            pathname === "/" ? "text-brand" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <HomeIcon active={pathname === "/"} />
        </Link>

        <Link
          href="/compose"
          className="flex flex-col items-center gap-0.5 p-2 rounded-xl text-brand hover:text-blue-600 transition-colors"
        >
          <PlusIcon />
        </Link>

        <Link
          href="/profile"
          className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-colors ${
            pathname === "/profile" ? "text-brand" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <UserIcon active={pathname === "/profile"} />
        </Link>
      </div>
    </nav>
  );
}
