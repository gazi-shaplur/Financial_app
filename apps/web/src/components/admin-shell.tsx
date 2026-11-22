import Link from "next/link";

export function AdminShell({ title, children }: { title: string; children: React.ReactNode }) {
  const links = [
    ["Overview", "/admin"],
    ["Users", "/admin/users"],
    ["Categories", "/admin/categories"],
    ["Roles & permissions", "/admin/roles"],
    ["Settings", "/admin/settings"],
    ["Announcements", "/admin/announcements"],
    ["Audit logs", "/admin/audit"],
  ];
  return (
    <div className="min-h-screen bg-[#f4f5fa] md:grid md:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="sticky top-0 z-30 bg-[#20233a] px-4 py-4 text-white md:h-screen md:border-r md:border-[#30344f] md:px-5 md:py-6">
        <p className="mb-4 text-lg font-bold md:mb-7 md:px-2">BudgetBook Admin</p>
        <nav className="flex gap-1 overflow-x-auto md:flex-col md:space-y-1" aria-label="Admin navigation">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-xl px-3 text-sm font-semibold text-[#d8dae8] hover:bg-white/10 md:w-full">
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 px-4 py-6 sm:px-6 md:px-8">
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-[#20233a] sm:text-3xl">{title}</h1>
        {children}
      </main>
    </div>
  );
}
