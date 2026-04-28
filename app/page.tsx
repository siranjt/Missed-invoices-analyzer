import { Suspense } from "react";
import Dashboard from "@/components/dashboard";

export default function Page() {
  return (
    <main className="max-w-[1500px] mx-auto p-6">
      <Suspense fallback={<div className="text-sm text-zoca-neutral40">Loading…</div>}>
        <Dashboard />
      </Suspense>
    </main>
  );
}
