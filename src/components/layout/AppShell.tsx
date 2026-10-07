"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { hasSession } from "@/lib/mock/store";
import { MobileTopbar } from "./MobileTopbar";
import { Sidebar } from "./Sidebar";

/**
 * Bound book: fixed index rail on desktop, stacked masthead on phone.
 *
 * The demo has no server to guard routes, so the shell does it: without a demo
 * session it sends the reader to the sign-in page. Everything is client-side and
 * the check is decorative — there is no password behind it.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (hasSession()) {
      setChecked(true);
      return;
    }
    router.replace("/login?next=" + encodeURIComponent(window.location.pathname));
  }, [router]);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-body text-muted">Memuat buku…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <MobileTopbar />
      <div className="md:pl-[212px]">
        <main className="mx-auto w-full max-w-[1180px] px-4 py-6 md:px-10 md:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
