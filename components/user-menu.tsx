"use client";
import { signOut, useSession } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function UserMenu() {
  const { data: session, status } = useSession();
  if (status !== "authenticated" || !session?.user?.email) return null;
  return (
    <div className="flex items-center gap-2 text-xs text-zoca-neutral40">
      <span className="hidden sm:inline">{session.user.email}</span>
      <button
        onClick={() => signOut({ callbackUrl: "/auth/signin" })}
        className="btn-ghost"
        title="Sign out"
      >
        <LogOut size={14} />
        <span className="hidden md:inline">Sign out</span>
      </button>
    </div>
  );
}
