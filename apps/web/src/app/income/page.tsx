"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function IncomePage() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");
  async function load() {
    const now = new Date();
    try {
      const result = await api<{ items: any[] }>(`/income?month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
      setItems(result.items);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load income"); }
  }
  useEffect(() => { void load(); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api("/income", { method: "POST", body: JSON.stringify({
        name: form.get("name"), source: form.get("source"), amount: form.get("amount"),
        currencyCode: "USD", incomeAt: form.get("date"),
      }) });
      event.currentTarget.reset();
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to add income"); }
  }
  async function remove(id: string) {
    await api(`/income/${id}`, { method: "DELETE" });
    await load();
  }
  async function edit(item: any) {
    const name = window.prompt("Income name", item.name);
    if (name === null) return;
    const amount = window.prompt("Amount", String(item.amount));
    if (amount === null) return;
    try {
      await api(`/income/${item.id}`, { method: "PATCH", body: JSON.stringify({ name, amount }) });
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to edit income"); }
  }
  return (
    <AppShell title="Income" subtitle="Add and review the money received this month.">
      {error && <p role="alert" className="mb-4 text-sm text-[#b33b57]">{error}</p>}
      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <Card>
          <h2 className="mb-4 font-bold">Add income</h2>
          <form className="space-y-3" onSubmit={submit}>
            <Input name="name" placeholder="Income name" required />
            <Input name="source" placeholder="Source category" />
            <Input name="amount" type="number" min="0.01" step="0.01" placeholder="Amount" required />
            <Button className="w-full" type="submit">Add income</Button>
          </form>
        </Card>
        <Card>
          <h2 className="mb-4 font-bold">Monthly income</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b border-[#f0f1f5] pb-3">
                <div><p className="font-semibold">{item.name}</p><p className="text-sm text-[#6d7285]">{item.source || "Other"} · {new Date(item.incomeAt).toLocaleDateString()}</p></div>
                <div className="flex items-center gap-3"><p className="font-bold text-[#31a854]">${Number(item.amount).toFixed(2)}</p><Button variant="ghost" onClick={() => edit(item)}>Edit</Button><Button variant="ghost" onClick={() => remove(item.id)}>Delete</Button></div>
              </div>
            ))}
            {!items.length && <p className="text-sm text-[#6d7285]">No income records for this month.</p>}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
