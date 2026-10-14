"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api, errorMessage, patch, post } from "@/lib/api";
import type { Role } from "@/lib/types";
import { Alert, Button, Field, Input, Select } from "@/components/ui";
import { useSession } from "./session";

type TeamUser = { id: string; name: string; email: string; role: Role; active: boolean };

export function TeamPage() {
  const { user: me } = useSession();
  const [users, setUsers] = useState<TeamUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "staff" as Role });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    api<{ users: TeamUser[] }>("/api/admin/users")
      .then(({ users }) => setUsers(users))
      .catch((err) => setError(errorMessage(err)));
  }, []);
  useEffect(load, [load]);

  async function add(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await post("/api/admin/users", form);
      setNotice(`${form.name} can now sign in with ${form.email}.`);
      setForm({ name: "", email: "", password: "", role: "staff" });
      load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function update(u: TeamUser, change: Partial<Pick<TeamUser, "active" | "role">>) {
    setError(null);
    try {
      await patch(`/api/admin/users/${u.id}`, change);
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="font-display text-4xl font-extrabold">Team</h1>
        <p className="mt-1 text-ink-soft">Gate staff can only scan tickets. Admins can do everything.</p>
      </div>

      {error && <Alert>{error}</Alert>}
      {notice && <Alert tone="ok">{notice}</Alert>}

      <ul className="divide-y divide-line border-y border-line">
        {users?.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className={`font-semibold ${u.active ? "" : "text-muted line-through"}`}>
                {u.name} {u.id === me.id && <span className="font-normal text-muted">(you)</span>}
              </p>
              <p className="text-sm text-muted">{u.email}</p>
            </div>
            <Select
              value={u.role}
              disabled={u.id === me.id}
              onChange={(e) => update(u, { role: e.target.value as Role })}
              className="w-auto py-2"
              aria-label={`Role for ${u.name}`}
            >
              <option value="staff">Gate staff</option>
              <option value="admin">Admin</option>
            </Select>
            {u.id !== me.id && (
              <Button variant={u.active ? "danger" : "ghost"} className="px-4 py-2 text-sm" onClick={() => update(u, { active: !u.active })}>
                {u.active ? "Remove access" : "Restore access"}
              </Button>
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={add} className="grid gap-4 rounded-2xl bg-lilac p-5 sm:grid-cols-2">
        <h2 className="font-display text-2xl font-bold sm:col-span-2">Add someone</h2>
        <Field label="Name">
          <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Email">
          <Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Temporary password" hint="At least 8 characters. Share it with them privately.">
          <Input
            required
            minLength={8}
            type="text"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </Field>
        <Field label="Role">
          <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
            <option value="staff">Gate staff</option>
            <option value="admin">Admin</option>
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <Button type="submit" variant="secondary" disabled={busy}>
            {busy ? "Adding…" : "Add to team"}
          </Button>
        </div>
      </form>
    </div>
  );
}
