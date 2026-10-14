import { LoginForm } from "@/components/admin/LoginForm";
import { SITE_NAME } from "@/lib/config";

export const metadata = { title: "Sign in", robots: { index: false } };

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-lilac px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 sm:p-8">
        <h1 className="font-display text-3xl font-extrabold">{SITE_NAME} admin</h1>
        <p className="mt-1 text-ink-soft">Sign in to manage orders and scan tickets.</p>
        <LoginForm />
      </div>
    </main>
  );
}
