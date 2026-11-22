"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";

export default function AdminAudit() {
  const [logs, setLogs] = useState<any[]>([]);
  const [error, setError] = useState("");
  return (
    <AdminShell title="Audit Logs">
      {error && <p className="mb-4 text-sm text-[#b33b57]">{error}</p>}
      <Card><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-[#ececf5] text-[#6d7285]"><th className="py-3">Timestamp</th><th>Administrator</th><th>Action</th><th>Entity</th></tr></thead><tbody>{logs.map((log) => <tr key={log.id} className="border-b border-[#f3f3f7]"><td className="py-4">{new Date(log.createdAt).toLocaleString()}</td><td>{log.actor?.name || log.actor?.email || "System"}</td><td className="font-semibold">{log.action}</td><td>{log.entityType}</td></tr>)}</tbody></table></div></Card>
    </AdminShell>
  );
}
