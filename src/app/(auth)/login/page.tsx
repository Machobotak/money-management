"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiPost } from "@/lib/api";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      // Demonstration only: the password is decorative and nothing is verified.
      await apiPost("/api/auth/login", { password });
      const target = next && next.startsWith("/") ? next : "/dashboard";
      router.replace(target);
      router.refresh();
    } catch {
      setError("Gagal masuk. Muat ulang halaman lalu coba lagi.");
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="fore-edge h-[5px] w-full" aria-hidden />
        <div className="sheet mt-3 p-6">
          <h1 className="text-mast text-ink">Buku Besar</h1>
          <div className="rule-double mt-3" aria-hidden />
          <p className="mt-3 text-body text-muted">Masuk untuk membuka buku keuanganmu.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-5">
            <Input
              label="Kata sandi"
              name="password"
              type="password"
              autoComplete="current-password"
              autoFocus
              required
              value={password}
              error={error ?? undefined}
              onChange={(event) => {
                setPassword(event.target.value);
                setError(null);
              }}
              placeholder="••••••••"
              helper="Isi apa saja — tidak ada pemeriksaan kata sandi sungguhan."
            />
            <Button type="submit" variant="primary" className="w-full" loading={pending}>
              Masuk
            </Button>
          </form>
        </div>

        <p className="mt-4 text-caption text-faint">
          Versi demo portofolio. Satu pengguna contoh, tanpa pendaftaran, tanpa autentikasi sungguhan
          — seluruh data adalah contoh yang tersimpan di browser.
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <p className="text-body text-muted">Memuat…</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
