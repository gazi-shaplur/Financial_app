"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function AdminCategories() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");
  async function load() { try { setItems(await api<any[]>("/admin/categories?includeArchived=true")); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load categories"); } }
  useEffect(() => { void load(); }, []);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    try { await api("/admin/categories", { method: "POST", body: JSON.stringify({ name: form.get("name"), icon: form.get("icon"), color: form.get("color"), categoryType: form.get("categoryType"), displayOrder: Number(form.get("displayOrder") || 0), isArchived: false }) }); event.currentTarget.reset(); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to create category"); }
  }
  async function toggle(item: any) { await api(`/admin/categories/${item.id}`, { method: "PATCH", body: JSON.stringify({ ...item, isArchived: !item.isArchived }) }); await load(); }
  async function remove(id: string) { if (window.confirm("Disable this system category?")) { await api(`/admin/categories/${id}`, { method: "DELETE" }); await load(); } }
  return (
    <AdminShell title="Category Management">
      {error && <p className="mb-4 text-sm text-[#b33b57]">{error}</p>}
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]"><Card><h2 className="mb-4 font-bold">Create category</h2><form className="space-y-3" onSubmit={create}><Input name="name" placeholder="Category name" required /><Input name="icon" placeholder="Icon name" /><Input name="color" type="color" defaultValue="#6c63d8" /><select name="categoryType" className="h-11 w-full rounded-xl border border-[#e8e9f1] px-3"><option>EXPENSE</option><option>INCOME</option></select><Input name="displayOrder" type="number" min="0" defaultValue="0" /><Button type="submit" className="w-full">Create</Button></form></Card>
      <Card><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-[#ececf5] text-[#6d7285]"><th className="py-3">Category</th><th>Type</th><th>Order</th><th>Status</th><th>Actions</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-b border-[#f3f3f7]"><td className="py-4"><span className="mr-2 inline-block h-3 w-3 rounded-full" style={{ background: item.color || "#6c63d8" }} />{item.name}</td><td>{item.categoryType}</td><td>{item.displayOrder}</td><td>{item.isArchived ? "Disabled" : "Enabled"}</td><td><div className="flex gap-2"><Button variant="secondary" onClick={() => toggle(item)}>{item.isArchived ? "Enable" : "Disable"}</Button><Button variant="ghost" onClick={() => remove(item.id)}>Delete</Button></div></td></tr>)}</tbody></table></div></Card></div>
    </AdminShell>
  );
}
