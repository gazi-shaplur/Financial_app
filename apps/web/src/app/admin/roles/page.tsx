"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";

export default function AdminRoles() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    api<any[]>("/admin/roles").then(setRoles).catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load roles"));
    api<any[]>("/admin/permissions").then(setPermissions).catch(() => setPermissions([]));
  }, []);
  async function savePermissions(role: any) {
    const selected = window.prompt(
      "Comma-separated permission keys",
      role.permissions?.map((entry: any) => entry.permission.key).join(", ") || "",
    );
    if (selected === null) return;
    try {
      await api(`/admin/roles/${role.id}/permissions`, {
        method: "PUT",
        body: JSON.stringify({ permissions: selected.split(",").map((key) => key.trim()).filter(Boolean) }),
      });
      setRoles(await api<any[]>("/admin/roles"));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to update permissions"); }
  }
  return (
    <AdminShell title="Roles and Permissions">
      {error && <p className="mb-4 text-sm text-[#b33b57]">{error}</p>}
      <Card>
        <p className="mb-4 text-xs text-[#6d7285]">Available permission keys: {permissions.map((permission) => permission.key).join(", ") || "none"}</p>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-[#ececf5] text-[#6d7285]"><th className="py-3">Role</th><th>Description</th><th>Users</th><th>Assigned permissions</th><th>Actions</th></tr></thead><tbody>{roles.map((role) => <tr key={role.id} className="border-b border-[#f3f3f7]"><td className="py-4 font-semibold">{role.name}</td><td>{role.description || "-"}</td><td>{role._count?.users ?? 0}</td><td>{role.permissions?.map((entry: any) => entry.permission.key).join(", ") || "None"}</td><td><button className="text-sm font-semibold text-[#6c63d8]" onClick={() => savePermissions(role)}>Manage</button></td></tr>)}</tbody></table></div>
      </Card>
    </AdminShell>
  );
}
