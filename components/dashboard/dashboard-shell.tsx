'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, Bell, LogOut, Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useIsMobile } from '@/hooks/use-mobile';

export type DashboardNavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
};

type DashboardShellProps = {
  brandTitle: string;
  navItems: DashboardNavItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  children: ReactNode;
  userBadge: ReactNode;
  notifications?: ReactNode;
  homeTabId?: string;
  homeLabel?: string;
};

export function DashboardShell({
  brandTitle,
  navItems,
  activeTab,
  onTabChange,
  onLogout,
  children,
  userBadge,
  notifications,
  homeTabId = 'dashboard',
  homeLabel = 'الرئيسية',
}: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="relative isolate flex min-h-screen overflow-x-hidden overflow-y-auto bg-slate-50 text-[#0A2540]" dir="rtl">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="pointer-events-none absolute right-[-10%] top-[10%] h-[600px] w-[600px] rounded-full bg-[#D4AF37]/10 blur-[150px]" />
        <div className="pointer-events-none absolute left-[-10%] bottom-[20%] h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <AnimatePresence>
        {isSidebarOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-auto fixed inset-0 z-40 bg-[#0A2540]/60 backdrop-blur-sm lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        ) : null}
      </AnimatePresence>

      <motion.aside
        className={`fixed right-0 top-0 z-[60] flex h-full w-72 flex-col border-l border-white/20 bg-white/70 shadow-[0_0_40px_rgba(0,0,0,0.05)] backdrop-blur-2xl transition-transform duration-300 lg:static ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center justify-between border-b border-black/5 p-5 pb-4 sm:p-6">
          <div className="flex flex-col gap-1.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0A2540] text-sm font-black text-white">
              VC
            </div>
            <h2 className="text-lg font-extrabold tracking-tight text-[#0A2540] sm:text-xl">
              {brandTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="rounded-xl bg-black/5 p-2 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-3 flex-1 space-y-1 overflow-y-auto p-3 sm:p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onTabChange(item.id);
                  setIsSidebarOpen(false);
                }}
                className="group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl px-3 py-3 text-right text-sm transition-all duration-300 sm:gap-4 sm:px-4 sm:py-3.5 sm:text-base"
              >
                {isActive ? (
                  <motion.div
                    layoutId="dashboard-sidebar-active"
                    className="absolute inset-0 z-0 rounded-2xl bg-[#0A2540] shadow-lg"
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  />
                ) : null}
                <Icon
                  className={`relative z-10 h-5 w-5 transition-colors ${
                    isActive
                      ? 'text-[#D4AF37]'
                      : 'text-slate-500 group-hover:text-[#0A2540]'
                  }`}
                />
                <span
                  className={`relative z-10 font-bold transition-colors ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-600 group-hover:text-[#0A2540]'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-black/5 p-4">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition-colors hover:bg-red-100 sm:py-3.5 sm:text-base"
          >
            <LogOut className="h-5 w-5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </motion.aside>

      <main className="relative z-20 flex h-screen flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-black/5 bg-white/50 px-4 py-3 backdrop-blur-xl sm:px-5 sm:py-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="rounded-xl bg-black/5 p-2 transition-colors hover:bg-black/10 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            {activeTab !== homeTabId ? (
              <button
                type="button"
                onClick={() => onTabChange(homeTabId)}
                className="flex items-center gap-2 rounded-xl border border-black/5 bg-slate-100 p-2 text-slate-600 shadow-sm transition-transform hover:scale-105"
              >
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden whitespace-nowrap text-sm font-bold md:inline">
                  {homeLabel}
                </span>
              </button>
            ) : null}

            <div className={`items-center gap-4 rounded-full border border-black/5 bg-white p-1.5 pr-2 shadow-sm ${isMobile ? 'hidden' : 'hidden md:flex'}`}>
              {userBadge}
            </div>
          </div>

          <div className="relative flex items-center gap-3">
            {notifications ? (
              <button
                type="button"
                onClick={() => setShowNotifications((current) => !current)}
                className="relative rounded-full border border-black/5 bg-white p-2.5 text-slate-600 shadow-sm transition-transform hover:scale-105"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-white bg-red-500" />
              </button>
            ) : null}

            <AnimatePresence>
              {showNotifications && notifications ? (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute left-0 top-14 z-50 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
                >
                  {notifications}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </header>

        <div className="relative flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
