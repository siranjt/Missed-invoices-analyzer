"use client";
import { signOut, useSession } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function UserMenu() {
  const { data: session, status } = useSession();
  if (status !== "authenticated" || !session?.user?.email) return null;
  const email = session.user.email;
  const initials = email
    .split("@")[0]
    .split(/[._-]/)
    .map((s) => s[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 2) || "?";
  return (
    <div className="flex items-center gap-2 pl-2 ml-1 border-l border-zoca-border">
      <div className="w-7 h-7 rounded-full bg-zoca-purple text-white text-[10px] font-semibold flex items-center justify-center">
        {initials}
      </div>
      <span className="hidden sm:inline text-[11px] text-zoca-textMuted">{email}</span>
      <button
        onClick={() => signOut({ callbackUrl: "/auth/signin" })}
        className="btn-ghost"
        title="Sign out"
      >
        <LogOut size={13} />
        <span className="hidden md:inline">Sign out</span>
      </button>
    </div>
  );
}
