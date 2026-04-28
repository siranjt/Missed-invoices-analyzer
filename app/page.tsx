import { Suspense } from "react";
import Dashboard from "@/components/dashboard";

export default function Page() {
  return (
    <main className="max-w-[1500px] mx-auto px-6 py-6">
      <Suspense fallback={<div className="text-sm text-zoca-textMuted">Loading…</div>}>
        <Dashboard />
      </Suspense>
    </main>
  );
}
