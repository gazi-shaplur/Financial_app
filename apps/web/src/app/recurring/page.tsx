"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function RecurringPage() {
  const [items, setItems] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [error, setError] = useState("");
  async function load() {
    try { setItems(await api<any[]>("/recurring")); setAccounts(await api<any[]>("/accounts")); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load recurring transactions"); }
  }
  useEffect(() => { void load(); }, []);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    try {
      await api("/recurring", { method: "POST", body: JSON.stringify({ accountId: form.get("accountId"), type: form.get("type"), amount: form.get("amount"), currencyCode: "USD", description: form.get("description"), frequency: form.get("frequency"), nextRunAt: form.get("nextRunAt") }) });
      event.currentTarget.reset(); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to create recurring transaction"); }
  }
  async function toggle(item: any) { await api(`/recurring/${item.id}/${item.isActive ? "pause" : "resume"}`, { method: "POST" }); await load(); }
  async function remove(id: string) { if (window.confirm("Cancel this recurring transaction?")) { await api(`/recurring/${id}`, { method: "DELETE" }); await load(); } }
  return (
    <AppShell title="Recurring Transactions" subtitle="Schedule automatic income and expense records.">
      {error && <p role="alert" className="mb-4 text-sm text-[#b33b57]">{error}</p>}
      <div className="grid gap-5 lg:grid-cols-[340px_1fr]"><Card><h2 className="mb-4 font-bold">Create schedule</h2><form className="space-y-3" onSubmit={create}><select name="accountId" className="h-11 w-full rounded-xl border border-[#e8e9f1] px-3" required><option value="">Account</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select><select name="type" className="h-11 w-full rounded-xl border border-[#e8e9f1] px-3"><option>EXPENSE</option><option>INCOME</option></select><Input name="amount" type="number" min="0.01" step="0.01" placeholder="Amount" required /><Input name="description" placeholder="Description" /><select name="frequency" className="h-11 w-full rounded-xl border border-[#e8e9f1] px-3"><option>DAILY</option><option>WEEKLY</option><option>MONTHLY</option><option>YEARLY</option></select><Input name="nextRunAt" type="date" required /><Button className="w-full" type="submit">Create recurrence</Button></form></Card>
      <Card><h2 className="mb-4 font-bold">Schedules</h2>{items.map((item) => <div key={item.id} className="mb-3 flex flex-wrap items-center justify-between border-b border-[#f3f3f7] pb-3"><div><p className="font-semibold">{item.description || item.type}</p><p className="text-sm text-[#6d7285]">${Number(item.amount).toFixed(2)} · {item.frequency} · next {new Date(item.nextRunAt).toLocaleDateString()}</p></div><div className="flex gap-2"><Button variant="secondary" onClick={() => toggle(item)}>{item.isActive ? "Pause" : "Resume"}</Button><Button variant="ghost" onClick={() => remove(item.id)}>Cancel</Button></div></div>)}{!items.length && <p className="text-sm text-[#6d7285]">No recurring schedules yet.</p>}</Card></div>
    </AppShell>
  );
}
