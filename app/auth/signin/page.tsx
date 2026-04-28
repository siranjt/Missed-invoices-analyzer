"use client";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignInInner() {
  const params = useSearchParams();
  const error = params.get("error");
  const callbackUrl = params.get("callbackUrl") || "/";

  const errorMsg =
    error === "AccessDenied"
      ? "That account isn't a @zoca.com address. Sign in with your Zoca Google account."
      : error
      ? "Sign-in failed. Please try again."
      : null;

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="card-zoca w-full max-w-sm text-center space-y-5">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.2em] text-zoca-neutral40">
            Zoca · Finance
          </p>
          <h1 className="display text-2xl font-bold text-zoca-purpleDark">
            Missed Invoice Tracker
          </h1>
          <p className="text-xs text-zoca-neutral40">
            Sign in with your @zoca.com Google account.
          </p>
        </div>

        {errorMsg && (
          <div
            className="text-xs px-3 py-2 rounded-lg"
            style={{ background: "#fff0f3", color: "#9b1d3b", border: "1px solid #ffd6e1" }}
          >
            {errorMsg}
          </div>
        )}

        <button
          onClick={() => signIn("google", { callbackUrl })}
          className="btn-zoca w-full justify-center"
        >
          Continue with Google
        </button>

        <p className="text-[11px] text-zoca-neutral40">
          Restricted to Zoca employees. Other accounts will be denied.
        </p>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<main className="min-h-screen" />}>
      <SignInInner />
    </Suspense>
  );
}
