"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";

type Dashboard = {
  income: number; expense: number; net: number; budget: number; budgetRemaining: number;
  savings: number; pendingTodos: number; budgetUtilization: number; budgetExceeded: boolean;
  spendingByCategory: Array<{ name: string; amount: number }>;
  weeklySpending: Array<{ week: number; amount: number }>;
};

export default function Home() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const now = new Date();
    api<Dashboard>(`/dashboard?year=${now.getFullYear()}&month=${now.getMonth() + 1}`)
      .then(setDashboard)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load dashboard"));
  }, []);
  return (
    <AppShell title="Dashboard" subtitle="Review your month at a glance.">
      {error && <Card className="mb-5 border-[#f2bac6] text-[#b33b57]">{error}. <Link className="font-semibold underline" href="/login">Sign in</Link></Card>}
      <section className="mb-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card><p className="text-sm text-[#6d7285]">Monthly income</p><p className="mt-2 text-2xl font-bold text-[#31a854]">${dashboard?.income.toFixed(2) ?? "0.00"}</p></Card>
        <Card><p className="text-sm text-[#6d7285]">Monthly expenses</p><p className="mt-2 text-2xl font-bold text-[#e45b75]">${dashboard?.expense.toFixed(2) ?? "0.00"}</p></Card>
        <Card><p className="text-sm text-[#6d7285]">Remaining balance</p><p className="mt-2 text-2xl font-bold">${dashboard?.net.toFixed(2) ?? "0.00"}</p></Card>
        <Card><p className="text-sm text-[#6d7285]">Total savings</p><p className="mt-2 text-2xl font-bold text-[#31a854]">${dashboard?.savings.toFixed(2) ?? "0.00"}</p></Card>
      </section>
      <section className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-5 font-bold">Spending by category</h2>
          {dashboard?.spendingByCategory.map((item) => (
            <div key={item.name} className="mb-3"><div className="mb-1 flex justify-between text-sm"><span>{item.name}</span><span>${item.amount.toFixed(2)}</span></div><div className="h-2 rounded-full bg-[#ececf5]"><div className="h-2 rounded-full bg-[#6c63d8]" style={{ width: `${dashboard.expense ? Math.min(100, item.amount / dashboard.expense * 100) : 0}%` }} /></div></div>
          ))}
          {!dashboard?.spendingByCategory.length && <p className="text-sm text-[#6d7285]">No category spending yet.</p>}
        </Card>
        <Card>
          <h2 className="mb-5 font-bold">Weekly spending trend</h2>
          <div className="flex h-44 items-end gap-4">{dashboard?.weeklySpending.map((item) => {
            const max = Math.max(1, ...dashboard.weeklySpending.map((week) => week.amount));
            return <div key={item.week} className="flex flex-1 flex-col items-center justify-end"><div className="w-full rounded-t-lg bg-[#6c63d8]" style={{ height: `${item.amount / max * 140}px`, minHeight: item.amount ? 8 : 2 }} /><span className="mt-2 text-xs text-[#6d7285]">W{item.week}</span></div>;
          })}</div>
        </Card>
        <Card>
          <h2 className="font-bold">Budget utilization</h2>
          <p className={`mt-3 text-2xl font-bold ${dashboard?.budgetExceeded ? "text-[#e45b75]" : "text-[#31a854]"}`}>{dashboard?.budgetUtilization.toFixed(1) ?? "0"}%</p>
          <p className="mt-2 text-sm text-[#6d7285]">${dashboard?.budgetRemaining.toFixed(2) ?? "0.00"} remaining</p>
          {dashboard?.budgetExceeded && <p className="mt-3 font-semibold text-[#b33b57]">Budget exceeded</p>}
        </Card>
      </section>
    </AppShell>
  );
}
