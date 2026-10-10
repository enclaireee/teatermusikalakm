import { redirect } from "next/navigation";
import { adminConfigured, isAdmin } from "@/lib/admin";
import { LoginForm } from "./login-form";

// Reads the session cookie before rendering, so navigation here blocks (see layout.tsx).
export const instant = false;

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg-page bg-paper px-4 py-6">
      <LoginForm configured={adminConfigured()} />
    </main>
  );
}
