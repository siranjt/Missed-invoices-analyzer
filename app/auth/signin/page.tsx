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
      <div className="card-zoca w-full max-w-sm text-center space-y-5 !p-6">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.18em] text-zoca-purple font-medium">
            Zoca · Finance
          </p>
          <h1 className="display text-[22px] font-semibold text-zoca-text">
            Missed invoice tracker
          </h1>
          <p className="text-[11px] text-zoca-textDim">
            Sign in with your @zoca.com Google account.
          </p>
        </div>

        {errorMsg && (
          <div
            className="text-[12px] px-3 py-2 rounded-md"
            style={{
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.30)",
              color: "#fca5a5"
            }}
          >
            {errorMsg}
          </div>
        )}

        <button
          onClick={() => signIn("google", { callbackUrl })}
          className="btn-zoca w-full justify-center !py-2"
        >
          Continue with Google
        </button>

        <p className="text-[10px] text-zoca-textDim">
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
