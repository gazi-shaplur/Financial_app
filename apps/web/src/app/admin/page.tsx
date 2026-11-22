"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";

export default function AdminOverview() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api("/admin/overview").then(setData).catch((reason) => setError(reason instanceof Error ? reason.message : "Admin access denied"));
  }, []);
  const cards = data ? [
    ["Registered users", data.users], ["Active users", data.activeUsers], ["Suspended users", data.suspendedUsers],
    ["Transactions", data.transactions], ["Income records", data.incomeRecords], ["Expense records", data.expenseRecords],
    ["Savings balance", `$${data.savingsBalance.toFixed(2)}`], ["Audit records", data.auditLogs],
  ] : [];
  return (
    <AdminShell title="Admin Overview">
      {error && <Card className="mb-5 border-[#f2bac6] text-[#b33b57]">{error}</Card>}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => <Card key={label}><p className="text-sm text-[#6d7285]">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></Card>)}
      </div>
      {data?.registrationTrend && <Card className="mt-5"><h2 className="mb-4 font-bold">Registration trend</h2><div className="overflow-x-auto"><div className="flex h-36 min-w-[600px] items-end gap-2">{data.registrationTrend.map((entry: any) => <div key={entry.date} className="flex flex-1 flex-col items-center"><div className="w-full rounded-t bg-[#6c63d8]" style={{ height: `${Math.max(4, entry.count * 24)}px` }} /><span className="mt-1 text-[10px] text-[#6d7285]">{entry.date.slice(5)}</span></div>)}</div></div></Card>}
    </AdminShell>
  );
}
