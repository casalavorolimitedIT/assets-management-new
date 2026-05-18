"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { NotificationDropdown } from "@/components/custom/NotificationDropdown";
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  ArrowLeftRight,
  Settings,
  HelpCircle,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Users,
  Megaphone,
} from "lucide-react";
import { logout } from "@/app/(auth)/actions/auth-actions";
import { useIsMobile } from "@/hooks/use-mobile";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Investments", href: "/dashboard/investments", icon: TrendingUp },
  { label: "Portfolio", href: "/dashboard/portfolio", icon: Wallet },
  {
    label: "Transactions",
    href: "/dashboard/transactions",
    icon: ArrowLeftRight,
  },
];

const SECONDARY_NAV = [
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { label: "Help", href: "/dashboard/help", icon: HelpCircle },
];

const ADMIN_NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Investors", href: "/dashboard/investments", icon: Users },
  { label: "Portfolios", href: "/dashboard/portfolio", icon: Wallet },
  {
    label: "Transactions",
    href: "/dashboard/transactions",
    icon: ArrowLeftRight,
  },
  {
    label: "Broadcast",
    href: "/dashboard/broadcast",
    icon: Megaphone,
  },
];

interface DashboardShellProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "USER";
    metamap_status: any;
    initials: string;
  };
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isAdmin = user.role === "ADMIN";
  const navItems = isAdmin ? ADMIN_NAV_ITEMS : NAV_ITEMS;

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored !== null) setSidebarCollapsed(stored === "true");
  }, []);

  const toggleCollapsed = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  };

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-zinc-200 bg-white shadow-sm transition-all duration-300 ${
          isMobile
            ? sidebarOpen
              ? "translate-x-0 w-64"
              : "-translate-x-full w-64"
            : sidebarCollapsed
              ? "w-16"
              : "w-64"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-4">
          {!sidebarCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image
                src="/casalavoroLogon.png"
                width={110}
                height={32}
                alt="Logo"
                className="object-contain"
              />
            </Link>
          )}
          {!isMobile && (
            <button
              onClick={toggleCollapsed}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="size-4" />
              ) : (
                <ChevronLeft className="size-4" />
              )}
            </button>
          )}
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
            >
              <X className="size-5" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {!sidebarCollapsed && (
            <p className="px-3 text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">
              Menu
            </p>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  active
                    ? "bg-[#fff1e6] text-[#ff6900] shadow-sm"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 hover:translate-x-0.5"
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`size-5 shrink-0 transition-colors ${
                    active
                      ? "text-[#ff6900]"
                      : "text-zinc-400 group-hover:text-zinc-600"
                  }`}
                />
                {!sidebarCollapsed && <span>{item.label}</span>}
                {!sidebarCollapsed && active && (
                  <span className="ml-auto size-1.5 rounded-full bg-[#ff6900]" />
                )}
              </Link>
            );
          })}

          <div className="pt-4">
            {!sidebarCollapsed && (
              <p className="px-3 text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">
                More
              </p>
            )}
            {SECONDARY_NAV.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                    active
                      ? "bg-[#fff1e6] text-[#ff6900]"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 hover:translate-x-0.5"
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon
                    className={`size-5 shrink-0 ${
                      active
                        ? "text-[#ff6900]"
                        : "text-zinc-400 group-hover:text-zinc-600"
                    }`}
                  />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User footer */}
        <div className="border-t border-zinc-200 p-3">
          <div
            className={`flex items-center gap-3 rounded-lg p-2.5 ${
              sidebarCollapsed ? "justify-center" : ""
            }`}
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#fff1e6] text-[#ff6900] font-semibold text-sm">
              {user.initials}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                {isAdmin && (
                  <p className="mt-0.5 text-xs font-medium text-[#ff6900]">
                    Admin
                  </p>
                )}
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <button
              onClick={() => logout()}
              className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
            >
              <LogOut className="size-4" />
              <span>Log out</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div
        className={`flex flex-1 flex-col transition-all duration-300 ${
          isMobile ? "ml-0" : sidebarCollapsed ? "ml-16" : "ml-64"
        }`}
      >
        {/* Top bar */}
        <header className="flex z-50 h-16 items-center justify-between border-b border-zinc-200 bg-white/80 backdrop-blur-sm px-4 md:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 transition-colors md:hidden"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex items-center gap-4 ml-auto">
            <NotificationDropdown userId={user.id} isAdmin={isAdmin} />

            {isAdmin ? (
              <div className="hidden sm:flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700">
                <ShieldCheck className="size-3.5 text-[#ff6900]" />
                Admin
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2 rounded-full bg-[#fff1e6] px-3 py-1.5 text-xs font-medium text-[#ff6900]">
                <div className="size-1.5 rounded-full bg-[#ff6900] animate-pulse" />
                {user.metamap_status === null
                  ? "Pending Verification"
                  : "Verified"}
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
