"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

export default function ReportsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [range, setRange] = useState({ income: 0, expenses: 0, net: 0 });
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    api<any>("/reports/analytics?months=12").then(setAnalytics).catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load analytics"));
  }, []);
  async function loadRange() {
    if (!from || !to) { setError("Select both a start and end date."); return; }
    try {
      const result = await api<any>(`/reports/range?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}T23:59:59.999Z`);
      setRange({ income: result.income, expenses: result.expenses, net: result.income - result.expenses });
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load range"); }
  }
  function exportCsv() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
    const query = from && to ? `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}T23:59:59.999Z` : "";
    window.open(`${apiUrl}/api/reports/transactions.csv${query}`, "_blank");
  }
  return (
    <AppShell title="Financial Reports" subtitle="Compare income, spending and savings over time.">
      {error && <p role="alert" className="mb-4 text-sm text-[#b33b57]">{error}</p>}
      <div className="mb-5 flex flex-wrap gap-3"><Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /><Input type="date" value={to} onChange={(event) => setTo(event.target.value)} /><Button variant="secondary" onClick={loadRange}>Analyze range</Button><Button onClick={exportCsv}>Export CSV</Button><Button variant="secondary" onClick={() => window.print()}>Print report</Button></div>
      <section className="grid gap-5 md:grid-cols-3"><Card><p className="text-sm text-[#6d7285]">Range income</p><p className="mt-2 text-2xl font-bold text-[#31a854]">${range.income.toFixed(2)}</p></Card><Card><p className="text-sm text-[#6d7285]">Range expenses</p><p className="mt-2 text-2xl font-bold text-[#e45b75]">${range.expenses.toFixed(2)}</p></Card><Card><p className="text-sm text-[#6d7285]">Range net</p><p className="mt-2 text-2xl font-bold">${range.net.toFixed(2)}</p></Card></section>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card><h2 className="mb-4 font-bold">Income vs expenses</h2>{analytics?.incomeVsExpenses.map((item: any) => <div key={item.month} className="mb-3 flex items-center justify-between border-b border-[#f3f3f7] pb-2 text-sm"><span>{item.month}</span><span className="text-[#31a854]">${item.income.toFixed(2)}</span><span className="text-[#e45b75]">${item.expenses.toFixed(2)}</span></div>) || <p className="text-sm text-[#6d7285]">No monthly data yet.</p>}</Card>
        <Card><h2 className="mb-4 font-bold">Category spending</h2>{analytics?.categorySpending.map((item: any) => <div key={item.category} className="mb-3 flex justify-between border-b border-[#f3f3f7] pb-2 text-sm"><span>{item.category}</span><strong>${item.amount.toFixed(2)}</strong></div>) || <p className="text-sm text-[#6d7285]">No category spending yet.</p>}</Card>
        <Card><h2 className="mb-4 font-bold">Monthly savings trends</h2>{analytics?.savingsTrend.map((item: any) => <div key={item.month} className="mb-2 flex justify-between text-sm"><span>{item.month}</span><strong className="text-[#31a854]">${item.savings.toFixed(2)}</strong></div>)}</Card>
        <Card><h2 className="mb-4 font-bold">Financial summary</h2><p className="text-sm text-[#6d7285]">Total savings</p><p className="mt-1 text-2xl font-bold">${analytics?.totalSavings?.toFixed(2) ?? "0.00"}</p></Card>
      </div>
    </AppShell>
  );
}
