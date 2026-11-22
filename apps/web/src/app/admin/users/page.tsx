"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  async function load() {
    try { const result = await api<{ items: any[] }>(`/users?pageSize=100&search=${encodeURIComponent(search)}&status=${status}`); setUsers(result.items); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load users"); }
  }
  useEffect(() => { void load(); }, [search, status]);
  async function setUserStatus(id: string, next: string) {
    try { await api(`/users/${id}/status`, { method: "PATCH", body: JSON.stringify({ status: next }) }); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to update status"); }
  }
  async function remove(id: string) {
    if (!window.confirm("Suspend and soft-delete this account? Financial records will remain protected.")) return;
    try { await api(`/admin/users/${id}`, { method: "DELETE" }); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to delete account"); }
  }
  return (
    <AdminShell title="User Management">
      {error && <p className="mb-4 text-sm text-[#b33b57]">{error}</p>}
      <Card>
        <div className="mb-5 flex flex-wrap gap-3"><Input className="max-w-sm" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or email" /><select className="h-11 rounded-xl border border-[#e8e9f1] px-3" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option><option>ACTIVE</option><option>SUSPENDED</option></select></div>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-[#ececf5] text-[#6d7285]"><th className="py-3">User</th><th>Roles</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead><tbody>{users.map((user) => <tr key={user.id} className="border-b border-[#f3f3f7]"><td className="py-4"><p className="font-semibold">{user.name}</p><p className="text-xs text-[#6d7285]">{user.email}</p></td><td>{user.roles.join(", ")}</td><td><span className={`rounded-full px-2 py-1 text-xs ${user.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{user.status}</span></td><td>{new Date(user.createdAt).toLocaleDateString()}</td><td><div className="flex gap-2"><Button variant="secondary" onClick={() => setUserStatus(user.id, user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE")}>{user.status === "ACTIVE" ? "Suspend" : "Restore"}</Button><Button variant="ghost" onClick={() => remove(user.id)}>Delete</Button></div></td></tr>)}</tbody></table></div>
        {!users.length && <p className="py-6 text-sm text-[#6d7285]">No users found.</p>}
      </Card>
    </AdminShell>
  );
}
