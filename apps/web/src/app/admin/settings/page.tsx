"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function AdminSettings() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");
  async function load() { try { setItems(await api<any[]>("/admin/settings")); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load settings"); } }
  useEffect(() => { void load(); }, []);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    try {
      await api("/admin/settings", { method: "POST", body: JSON.stringify({ key: form.get("key"), value: form.get("value"), description: form.get("description"), isPublic: form.get("isPublic") === "true" }) });
      event.currentTarget.reset(); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save setting"); }
  }
  return (
    <AdminShell title="Application Settings">
      {error && <p className="mb-4 text-sm text-[#b33b57]">{error}</p>}
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]"><Card><h2 className="mb-4 font-bold">Create or update setting</h2><form className="space-y-3" onSubmit={save}><Input name="key" placeholder="Setting key" required /><Input name="value" placeholder="Value" required /><Input name="description" placeholder="Description" /><select name="isPublic" className="h-11 w-full rounded-xl border border-[#e8e9f1] px-3"><option value="true">Public setting</option><option value="false">Admin-only setting</option></select><Button type="submit" className="w-full">Save setting</Button></form></Card>
      <Card><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-[#ececf5] text-[#6d7285]"><th className="py-3">Key</th><th>Value</th><th>Visibility</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-b border-[#f3f3f7]"><td className="py-4 font-semibold">{item.key}</td><td>{JSON.stringify(item.value)}</td><td>{item.isPublic ? "Public" : "Admin"}</td></tr>)}</tbody></table></div></Card></div>
    </AdminShell>
  );
}
