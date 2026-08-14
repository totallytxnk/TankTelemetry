"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  LayoutDashboard,
  ScrollText,
  Settings,
  Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/#latency", label: "Latency", icon: Gauge },
  { href: "/#status", label: "Status Codes", icon: Activity },
  { href: "/#logs", label: "Live Logs", icon: ScrollText },
  { href: "/#settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-56 flex-col border-r border-neutral-800 bg-neutral-950">
      <div className="flex h-14 items-center gap-2 border-b border-neutral-800 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded border border-neutral-700 bg-black">
          <Activity className="h-4 w-4 text-white" strokeWidth={1.5} />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight text-white">
            TankTelemetry
          </span>
          <span className="text-[10px] uppercase tracking-widest text-neutral-500">
            Dashboard
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 p-3">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-400 hover:bg-neutral-900/60 hover:text-neutral-200"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-neutral-800 p-4">
        <div className="rounded-md border border-neutral-800 bg-black px-3 py-2">
          <p className="text-[10px] uppercase tracking-widest text-neutral-500">
            Environment
          </p>
          <p className="mt-0.5 font-mono text-xs text-neutral-300">production</p>
        </div>
      </div>
    </aside>
  );
}
