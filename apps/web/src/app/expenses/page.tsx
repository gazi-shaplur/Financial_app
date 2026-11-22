"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function ExpensesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  async function load() {
    const now = new Date();
    try {
      const [transactions, accountList, categoryList] = await Promise.all([
        api<{ items: any[] }>(`/transactions?type=EXPENSE&month=${now.getMonth() + 1}&year=${now.getFullYear()}&search=${encodeURIComponent(search)}&pageSize=100`),
        api<any[]>("/accounts"),
        api<any[]>("/categories"),
      ]);
      setItems(transactions.items); setAccounts(accountList); setCategories(categoryList);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load expenses"); }
  }
  useEffect(() => { void load(); }, [search]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api("/transactions", { method: "POST", body: JSON.stringify({
        accountId: form.get("accountId"), categoryId: form.get("categoryId") || undefined,
        type: "EXPENSE", amount: form.get("amount"), currencyCode: "USD",
        transactionAt: form.get("date"), description: form.get("description"),
        merchant: form.get("merchant"), paymentMethod: form.get("paymentMethod"),
      }) });
      event.currentTarget.reset(); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to add expense"); }
  }
  async function remove(id: string) { await api(`/transactions/${id}`, { method: "DELETE" }); await load(); }
  async function edit(item: any) {
    const amount = window.prompt("Amount", String(item.amount));
    if (amount === null) return;
    const description = window.prompt("Description", item.description || "") ?? item.description;
    try {
      await api(`/transactions/${item.id}`, { method: "PATCH", body: JSON.stringify({ amount, description }) });
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to edit expense"); }
  }
  return (
    <AppShell title="Expenses" subtitle="Track purchases and manage your monthly spending.">
      {error && <p role="alert" className="mb-4 text-sm text-[#b33b57]">{error}</p>}
      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <Card>
          <h2 className="mb-4 font-bold">Add expense</h2>
          <form className="space-y-3" onSubmit={submit}>
            <select name="accountId" className="h-11 w-full rounded-xl border border-[#e8e9f1] px-3" required>
              <option value="">Select account</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
            </select>
            <select name="categoryId" className="h-11 w-full rounded-xl border border-[#e8e9f1] px-3">
              <option value="">Uncategorized</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            <Input name="merchant" placeholder="Merchant" />
            <Input name="description" placeholder="Description" />
            <Input name="paymentMethod" placeholder="Payment method" />
            <Input name="amount" type="number" min="0.01" step="0.01" placeholder="Amount" required />
            <Button className="w-full" type="submit">Add expense</Button>
          </form>
        </Card>
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-bold">Expense history</h2><Input className="max-w-xs" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search expenses" /></div>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b border-[#f0f1f5] pb-3">
                <div><p className="font-semibold">{item.merchant || item.description || "Expense"}</p><p className="text-sm text-[#6d7285]">{item.category?.name || "Uncategorized"} · {item.paymentMethod || "Unknown"} · {new Date(item.transactionAt).toLocaleDateString()}</p></div>
                <div className="flex items-center gap-3"><p className="font-bold text-[#e45b75]">${Number(item.amount).toFixed(2)}</p><Button variant="ghost" onClick={() => edit(item)}>Edit</Button><Button variant="ghost" onClick={() => remove(item.id)}>Delete</Button></div>
              </div>
            ))}
            {!items.length && <p className="text-sm text-[#6d7285]">No expenses found.</p>}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
