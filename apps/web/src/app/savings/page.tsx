"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function SavingsPage() {
  const [pots, setPots] = useState<any[]>([]);
  const [error, setError] = useState("");
  async function load() {
    try { setPots(await api<any[]>("/savings")); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load savings"); }
  }
  useEffect(() => { void load(); }, []);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api("/savings", { method: "POST", body: JSON.stringify({ name: form.get("name"), targetAmount: form.get("targetAmount"), currencyCode: "USD", targetDate: form.get("targetDate") || null }) });
      event.currentTarget.reset(); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to create savings goal"); }
  }
  async function adjust(id: string, type: "deposit" | "withdraw", amount: string) {
    try { await api(`/savings/${id}/${type}`, { method: "POST", body: JSON.stringify({ amount }) }); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to update savings"); }
  }
  return (
    <AppShell title="Savings Pots" subtitle="Set goals, add funds and track your progress.">
      {error && <p role="alert" className="mb-4 text-sm text-[#b33b57]">{error}</p>}
      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        <Card>
          <h2 className="mb-4 font-bold">Create savings goal</h2>
          <form className="space-y-3" onSubmit={create}>
            <Input name="name" placeholder="Goal name" required />
            <Input name="targetAmount" type="number" min="0.01" step="0.01" placeholder="Target amount" required />
            <Input name="targetDate" type="date" />
            <Button className="w-full" type="submit">Create goal</Button>
          </form>
        </Card>
        <div className="grid gap-5 md:grid-cols-2">
          {pots.map((pot) => {
            const current = Number(pot.currentAmount), target = Number(pot.targetAmount);
            return (
              <Card key={pot.id}>
                <h2 className="font-bold">{pot.name}</h2>
                <p className="mt-2 text-2xl font-bold">${current.toFixed(2)} <span className="text-sm font-normal text-[#6d7285]">of ${target.toFixed(2)}</span></p>
                <div className="my-4 h-3 rounded-full bg-[#ececf5]"><div className="h-3 rounded-full bg-[#31a854]" style={{ width: `${Math.min(100, target ? current / target * 100 : 0)}%` }} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => { const amount = window.prompt("Deposit amount"); if (amount) void adjust(pot.id, "deposit", amount); }}>Add money</Button>
                  <Button variant="secondary" onClick={() => { const amount = window.prompt("Withdrawal amount"); if (amount) void adjust(pot.id, "withdraw", amount); }}>Withdraw</Button>
                </div>
              </Card>
            );
          })}
          {!pots.length && <Card><p className="text-sm text-[#6d7285]">No savings goals yet.</p></Card>}
        </div>
      </div>
    </AppShell>
  );
}
