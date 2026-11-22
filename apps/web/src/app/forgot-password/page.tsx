"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await api<{ message: string; resetToken?: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: String(form.get("email")) }),
      });
      setMessage(result.resetToken ? `${result.message} Development reset token: ${result.resetToken}` : result.message);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to process request");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f8fc] px-4 py-8 sm:px-6">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 block text-center text-2xl font-bold text-[#5b51c7]">BudgetBook</Link>
        <Card className="p-6 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-[#20243a]">Reset your password</h1>
          <p className="mt-2 text-sm leading-6 text-[#62687a]">Enter your email and we will prepare a secure reset request.</p>
          <form className="mt-6 space-y-5" onSubmit={submit}>
            <div><label htmlFor="forgot-email" className="mb-2 block text-sm font-semibold text-[#45495c]">Email address</label><Input id="forgot-email" name="email" type="email" placeholder="you@example.com" autoComplete="email" required /></div>
            {message && <p className="rounded-xl bg-[#edf8f1] px-3 py-2.5 text-sm text-[#237a43]">{message}</p>}
            {error && <p role="alert" className="rounded-xl bg-[#fff2f4] px-3 py-2.5 text-sm text-[#a82d49]">{error}</p>}
            <Button className="w-full" type="submit">Send reset request</Button>
          </form>
          <p className="mt-6 text-center text-sm"><Link className="font-semibold text-[#5b51c7] hover:underline" href="/login">Back to sign in</Link></p>
        </Card>
      </div>
    </main>
  );
}
