"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { errorMessage, post } from "@/lib/api";
import type { SessionUser } from "@/lib/types";
import { Alert, Button, Field, Input } from "@/components/ui";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { user } = await post<{ user: SessionUser }>("/api/auth/login", { email, password });
      // Read ?next= directly so this component doesn't need a Suspense boundary.
      const next = new URLSearchParams(window.location.search).get("next");
      const safeNext = next && next.startsWith("/admin") && !next.startsWith("/admin/login") ? next : null;
      router.replace(safeNext ?? (user.role === "admin" ? "/admin" : "/admin/scan"));
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
      <Field label="Email">
        <Input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Password">
        <Input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      {error && <Alert>{error}</Alert>}
      <Button type="submit" variant="secondary" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
