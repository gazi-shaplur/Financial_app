"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      await api("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: String(form.get("name")),
          email: String(form.get("email")),
          password: String(form.get("password")),
        }),
      });
      router.push("/login");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f8fc] px-4 py-8 sm:px-6">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 block text-center text-2xl font-bold text-[#5b51c7]">BudgetBook</Link>
        <Card className="p-6 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-[#20243a]">Create your account</h1>
          <p className="mt-2 text-sm leading-6 text-[#62687a]">Start tracking income, spending and savings in one place.</p>
          <form className="mt-6 space-y-5" onSubmit={submit}>
            <div><label htmlFor="register-name" className="mb-2 block text-sm font-semibold text-[#45495c]">Full name</label><Input id="register-name" name="name" placeholder="Your full name" minLength={2} autoComplete="name" required /></div>
            <div><label htmlFor="register-email" className="mb-2 block text-sm font-semibold text-[#45495c]">Email address</label><Input id="register-email" name="email" type="email" placeholder="you@example.com" autoComplete="email" required /></div>
            <div><label htmlFor="register-password" className="mb-2 block text-sm font-semibold text-[#45495c]">Password</label><Input id="register-password" name="password" type="password" placeholder="Uppercase, lowercase and number" minLength={10} autoComplete="new-password" required /><p className="mt-2 text-xs leading-5 text-[#62687a]">Use at least 10 characters, including uppercase, lowercase and a number.</p></div>
            {error && <p role="alert" className="rounded-xl bg-[#fff2f4] px-3 py-2.5 text-sm text-[#a82d49]">{error}</p>}
            <Button className="w-full" type="submit" disabled={loading}>{loading ? "Creating..." : "Create account"}</Button>
          </form>
          <div className="my-5 flex items-center gap-3" aria-hidden="true">
            <div className="h-px flex-1 bg-[#e5e7ef]" />
            <span className="text-xs font-semibold uppercase tracking-wide text-[#85899a]">or</span>
            <div className="h-px flex-1 bg-[#e5e7ef]" />
          </div>
          <a
            href={`${apiUrl}/api/auth/google`}
            className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#dfe1eb] bg-white px-4 text-sm font-semibold text-[#20243a] hover:border-[#bfc2d2] hover:bg-[#fafbfd]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M21.35 12.2c0-.71-.06-1.39-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.4h3.14c1.84-1.69 2.91-4.18 2.91-7.17Z" />
              <path fill="#34A853" d="M12 21.75c2.62 0 4.82-.87 6.44-2.38l-3.14-2.4c-.87.58-1.98.93-3.3.93-2.54 0-4.69-1.71-5.46-4.02H3.29v2.48A9.71 9.71 0 0 0 12 21.75Z" />
              <path fill="#FBBC05" d="M6.54 13.88A5.84 5.84 0 0 1 6.23 12c0-.65.11-1.28.31-1.88V7.64H3.29A9.71 9.71 0 0 0 2.25 12c0 1.57.38 3.06 1.04 4.36l3.25-2.48Z" />
              <path fill="#EA4335" d="M12 6.1c1.43 0 2.7.49 3.71 1.45l2.8-2.8A9.37 9.37 0 0 0 12 2.25 9.71 9.71 0 0 0 3.29 7.64l3.25 2.48C7.31 7.81 9.46 6.1 12 6.1Z" />
            </svg>
            Continue with Google
          </a>
          <p className="mt-6 text-center text-sm text-[#62687a]">
            Already have an account? <Link className="font-semibold text-[#5b51c7] hover:underline" href="/login">Sign in</Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
