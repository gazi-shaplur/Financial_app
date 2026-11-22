"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function TodosPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");
  async function load() {
    try { setTasks(await api<any[]>(`/todos${filter ? `?status=${filter}` : ""}`)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load tasks"); }
  }
  useEffect(() => { void load(); }, [filter]);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api("/todos", { method: "POST", body: JSON.stringify({ title: form.get("title"), description: form.get("description"), priority: form.get("priority"), dueAt: form.get("dueAt") || null, amount: form.get("amount") || null }) });
      event.currentTarget.reset(); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to create task"); }
  }
  async function toggle(task: any) {
    await api(`/todos/${task.id}`, { method: "PATCH", body: JSON.stringify({ status: task.status === "COMPLETED" ? "PENDING" : "COMPLETED" }) });
    await load();
  }
  async function remove(id: string) { await api(`/todos/${id}`, { method: "DELETE" }); await load(); }
  return (
    <AppShell title="To-Do" subtitle="Organize financial tasks and important deadlines.">
      {error && <p role="alert" className="mb-4 text-sm text-[#b33b57]">{error}</p>}
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <Card>
          <h2 className="mb-4 font-bold">Create task</h2>
          <form className="space-y-3" onSubmit={create}>
            <Input name="title" placeholder="Task title" required />
            <Input name="description" placeholder="Description" />
            <Input name="amount" type="number" min="0" step="0.01" placeholder="Optional amount" />
            <Input name="dueAt" type="date" />
            <select name="priority" className="h-11 w-full rounded-xl border border-[#e8e9f1] px-3"><option>MEDIUM</option><option>LOW</option><option>HIGH</option></select>
            <Button className="w-full" type="submit">Add task</Button>
          </form>
        </Card>
        <Card>
          <div className="mb-4 flex gap-2"><Button variant={filter === "" ? "primary" : "secondary"} onClick={() => setFilter("")}>All</Button><Button variant={filter === "PENDING" ? "primary" : "secondary"} onClick={() => setFilter("PENDING")}>Pending</Button><Button variant={filter === "COMPLETED" ? "primary" : "secondary"} onClick={() => setFilter("COMPLETED")}>Completed</Button></div>
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between border-b border-[#f0f1f5] pb-3">
                <button className="text-left" onClick={() => toggle(task)}><p className={`font-semibold ${task.status === "COMPLETED" ? "line-through text-[#6d7285]" : ""}`}>{task.title}</p><p className="text-sm text-[#6d7285]">{task.amount ? `$${Number(task.amount).toFixed(2)} · ` : ""}{task.priority}{task.dueAt ? ` · ${new Date(task.dueAt).toLocaleDateString()}` : ""}</p></button>
                <Button variant="ghost" onClick={() => remove(task.id)}>Delete</Button>
              </div>
            ))}
            {!tasks.length && <p className="text-sm text-[#6d7285]">No tasks found.</p>}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
