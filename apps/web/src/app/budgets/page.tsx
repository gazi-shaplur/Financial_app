"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function BudgetsPage() {
  const [progress, setProgress] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [error, setError] = useState("");
  async function load() {
    const now = new Date();
    try {
      setProgress(await api(`/budgets/progress?year=${now.getFullYear()}&month=${now.getMonth() + 1}`));
      setCategories(await api<any[]>("/categories"));
    }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load budget"); }
  }
  useEffect(() => { void load(); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const now = new Date();
    try {
      await api("/budgets", { method: "PUT", body: JSON.stringify({
        year: now.getFullYear(), month: now.getMonth() + 1,
        amount: form.get("amount"), currencyCode: "USD", rollover: false,
        categories: form.get("categoryId") && form.get("categoryAmount") ? [{ categoryId: form.get("categoryId"), amount: form.get("categoryAmount") }] : [],
      }) });
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save budget"); }
  }
  return (
    <AppShell title="Monthly Budget" subtitle="Set spending limits and monitor remaining funds.">
      {error && <p role="alert" className="mb-4 text-sm text-[#b33b57]">{error}</p>}
      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-bold">Set monthly budget</h2>
          <form className="space-y-3" onSubmit={submit}>
            <Input name="amount" type="number" min="0" step="0.01" placeholder="Total budget" required />
            <select name="categoryId" className="h-11 w-full rounded-xl border border-[#e8e9f1] px-3"><option value="">Optional category allocation</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
            <Input name="categoryAmount" type="number" min="0" step="0.01" placeholder="Category budget amount" />
            <Button type="submit">Save budget</Button>
          </form>
        </Card>
        <Card>
          <p className="text-sm text-[#6d7285]">Budget utilization</p>
          <p className="mt-2 text-3xl font-bold">{progress ? `${progress.remaining >= 0 ? "$" + progress.remaining.toFixed(2) + " remaining" : "$" + Math.abs(progress.remaining).toFixed(2) + " exceeded"}` : "$0.00"}</p>
          {progress && <div className="mt-5 h-3 rounded-full bg-[#ececf5]"><div className={`h-3 rounded-full ${progress.remaining >= 0 ? "bg-[#31a854]" : "bg-[#e45b75]"}`} style={{ width: `${Math.min(100, progress.total ? (progress.spent / progress.total) * 100 : 0)}%` }} /></div>}
          {progress?.remaining < 0 && <p className="mt-3 text-sm font-semibold text-[#b33b57]">Budget exceeded warning</p>}
        </Card>
      </div>
    </AppShell>
  );
}
