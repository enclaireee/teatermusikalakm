"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { login, type LoginState } from "../actions";

export function LoginForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="flex w-full max-w-[400px] flex-col gap-4 rounded-md border-2 border-border-default bg-bg-surface bg-paper p-6">
      <div className="flex flex-col gap-1">
        <h1 className="type-h3 text-text-brand">Masuk Admin</h1>
        <p className="type-caption text-text-secondary">Khusus panitia Teater Musikal Aku Kau &amp; Musik.</p>
      </div>
      {!configured && <Alert type="warning" title="Admin belum diatur">Isi ADMIN_USER dan ADMIN_PASSWORD di server (lihat backend.md).</Alert>}
      <Field label="Username" name="user" required autoComplete="username" />
      <Field label="Password" name="password" type="password" required autoComplete="current-password" />
      {state.error && <Alert type="error" title="Gagal masuk">{state.error}</Alert>}
      <Button flat type="submit" fullWidth loading={pending}>Masuk</Button>
    </form>
  );
}
