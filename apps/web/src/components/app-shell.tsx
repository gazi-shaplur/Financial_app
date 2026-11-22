"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  CircleDollarSign,
  LayoutDashboard,
  ReceiptText,
  Repeat2,
  Settings,
  Target,
  WalletCards,
} from "lucide-react";

const links = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Income", href: "/income", icon: CircleDollarSign },
  { label: "Expenses", href: "/expenses", icon: ReceiptText },
  { label: "Monthly budget", href: "/budgets", icon: WalletCards },
  { label: "Savings pots", href: "/savings", icon: Target },
  { label: "To-do", href: "/todos", icon: Settings },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Recurring", href: "/recurring", icon: Repeat2 },
  { label: "Notifications", href: "/notifications", icon: Bell },
];

export function AppShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f7f8fc] lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="sticky top-0 z-30 border-b border-[#e5e7ef] bg-white lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center border-b border-[#eef0f5] px-5 lg:h-20 lg:px-7">
          <Link href="/" className="text-xl font-bold tracking-tight text-[#5b51c7]" aria-label="BudgetBook dashboard">
            BudgetBook
          </Link>
        </div>
        <nav className="flex overflow-x-auto px-3 py-2.5 sm:grid sm:grid-cols-3 sm:overflow-visible md:grid-cols-5 md:gap-1 lg:block lg:space-y-1 lg:px-4 lg:py-5" aria-label="Primary navigation">
          {links.map(({ label, href, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`mr-1 flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold sm:mr-0 sm:min-w-0 lg:w-full lg:gap-3 ${
                  active
                    ? "bg-[#efeffa] text-[#5b51c7]"
                    : "text-[#62677a] hover:bg-[#f5f6fa] hover:text-[#20243a]"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-9 lg:py-8 xl:px-12">
        <header className="mb-7">
          <h1 className="text-2xl font-bold tracking-tight text-[#20243a] sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#62687a] sm:text-base">{subtitle}</p>}
        </header>
        {children}
      </main>
    </div>
  );
}
