import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only Supabase client using the secret key (bypasses RLS). Never import from client code.
// Created lazily so `next build` works without env vars; the first real request fails loudly instead.
let client: SupabaseClient | undefined;

export function supabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY must be set (copy .env.example to .env.local, see backend.md step 9).");
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}
