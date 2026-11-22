"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function AdminAnnouncements() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");
  async function load() { try { setItems(await api<any[]>("/admin/announcements")); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load announcements"); } }
  useEffect(() => { void load(); }, []);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    try { await api("/admin/announcements", { method: "POST", body: JSON.stringify({ title: form.get("title"), message: form.get("message"), severity: form.get("severity"), isActive: true }) }); event.currentTarget.reset(); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to create announcement"); }
  }
  async function remove(id: string) { if (window.confirm("Delete this announcement?")) { await api(`/admin/announcements/${id}`, { method: "DELETE" }); await load(); } }
  return (
    <AdminShell title="Announcements">
      {error && <p className="mb-4 text-sm text-[#b33b57]">{error}</p>}
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]"><Card><h2 className="mb-4 font-bold">Create announcement</h2><form className="space-y-3" onSubmit={create}><Input name="title" placeholder="Title" required /><textarea name="message" className="min-h-24 w-full rounded-xl border border-[#e8e9f1] p-3" placeholder="Message" required /><select name="severity" className="h-11 w-full rounded-xl border border-[#e8e9f1] px-3"><option>INFO</option><option>WARNING</option><option>CRITICAL</option></select><Button type="submit" className="w-full">Publish</Button></form></Card>
      <Card><div className="space-y-3">{items.map((item) => <div key={item.id} className="flex items-center justify-between border-b border-[#f3f3f7] pb-3"><div><p className="font-semibold">{item.title}</p><p className="text-sm text-[#6d7285]">{item.message}</p></div><div className="flex items-center gap-3"><span className="text-xs">{item.severity}</span><Button variant="ghost" onClick={() => remove(item.id)}>Delete</Button></div></div>)}</div></Card></div>
    </AdminShell>
  );
}
