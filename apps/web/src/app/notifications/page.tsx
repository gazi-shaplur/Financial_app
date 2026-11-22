"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");
  async function load() { try { setItems(await api<any[]>("/notifications")); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load notifications"); } }
  useEffect(() => { void load(); api<any[]>("/notifications/refresh-upcoming", { method: "POST" }).then(setItems).catch(() => undefined); }, []);
  async function markRead(id: string) { await api(`/notifications/${id}/read`, { method: "PATCH" }); await load(); }
  return (
    <AppShell title="Notifications" subtitle="Review budgets, savings and recurring-payment updates.">
      {error && <p className="mb-4 text-sm text-[#b33b57]">{error}</p>}
      <Card><div className="space-y-3">{items.map((item) => <div key={item.id} className="flex items-center justify-between border-b border-[#f3f3f7] pb-3"><div><p className="font-semibold">{item.title}</p><p className="text-sm text-[#6d7285]">{item.message}</p></div>{!item.readAt && <Button variant="secondary" onClick={() => markRead(item.id)}>Mark read</Button>}</div>)}{!items.length && <p className="text-sm text-[#6d7285]">No notifications. You are all caught up.</p>}</div></Card>
    </AppShell>
  );
}
