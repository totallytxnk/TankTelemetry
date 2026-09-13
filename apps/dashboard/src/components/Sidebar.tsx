"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, LayoutDashboard, ScrollText, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/#latency", label: "Latency", icon: Gauge },
  { href: "/#status", label: "Status", icon: Activity },
  { href: "/#logs", label: "Requests", icon: ScrollText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-white/[0.04] bg-surface md:flex">
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/15 text-accent-soft">
          <Activity className="h-4 w-4" strokeWidth={2} />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight text-zinc-50">
            TankTelemetry
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            Analytics
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 pt-4">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150",
                active
                  ? "bg-white/[0.06] text-zinc-50 shadow-sm"
                  : "text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  active ? "text-accent-soft" : "opacity-70 group-hover:opacity-100"
                )}
                strokeWidth={1.75}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/[0.04] px-4 py-4">
        <p className="text-[11px] leading-relaxed text-zinc-500">
          Live metrics · auto-refresh every 5s
        </p>
      </div>
    </aside>
  );
}
