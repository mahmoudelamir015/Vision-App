'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, Bell, LogOut, Menu, Moon, Sun, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

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
  const [isDarkMode, setIsDarkMode] = useState(() =>
    typeof window !== 'undefined' && document.documentElement.classList.contains('dark'),
  );
  const [showNotifications, setShowNotifications] = useState(false);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setIsDarkMode((current) => !current);
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-slate-50 text-[#0A2540] transition-colors duration-300 dark:bg-[#061524] dark:text-white" dir="rtl">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute right-[-10%] top-[10%] h-[600px] w-[600px] rounded-full bg-[#D4AF37]/10 blur-[150px] dark:bg-[#D4AF37]/5" />
        <div className="absolute left-[-10%] bottom-[20%] h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[120px] dark:bg-blue-500/5" />
      </div>

      <AnimatePresence>
        {isSidebarOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-[#0A2540]/60 backdrop-blur-sm lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        ) : null}
      </AnimatePresence>

      <motion.aside
        className={`fixed right-0 top-0 z-50 flex h-full w-72 flex-col border-l border-white/20 bg-white/70 shadow-[0_0_40px_rgba(0,0,0,0.05)] backdrop-blur-2xl transition-transform duration-300 dark:border-white/10 dark:bg-[#0A2540]/70 dark:shadow-[0_0_40px_rgba(0,0,0,0.3)] lg:static ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center justify-between border-b border-black/5 p-8 pb-6 dark:border-white/5">
          <div className="flex flex-col gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A2540] text-sm font-black text-white dark:bg-[#D4AF37] dark:text-[#0A2540]">
              VC
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-[#0A2540] dark:text-white">
              {brandTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="rounded-xl bg-black/5 p-2 dark:bg-white/5 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-4 flex-1 space-y-1 overflow-y-auto p-4">
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
                className="group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl px-4 py-3.5 text-right transition-all duration-300"
              >
                {isActive ? (
                  <motion.div
                    layoutId="dashboard-sidebar-active"
                    className="absolute inset-0 z-0 rounded-2xl bg-[#0A2540] shadow-lg dark:bg-[#D4AF37]"
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  />
                ) : null}
                <Icon
                  className={`relative z-10 h-5 w-5 transition-colors ${
                    isActive
                      ? 'text-[#D4AF37] dark:text-[#0A2540]'
                      : 'text-slate-500 group-hover:text-[#0A2540] dark:text-slate-400 dark:group-hover:text-white'
                  }`}
                />
                <span
                  className={`relative z-10 font-bold transition-colors ${
                    isActive
                      ? 'text-white dark:text-[#0A2540]'
                      : 'text-slate-600 group-hover:text-[#0A2540] dark:text-slate-300 dark:group-hover:text-white'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-black/5 p-4 dark:border-white/5">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-2xl bg-red-50 px-4 py-3.5 font-bold text-red-600 transition-colors hover:bg-red-100 dark:bg-red-900/10 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <LogOut className="h-5 w-5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </motion.aside>

      <main className="relative z-10 flex h-screen flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-black/5 bg-white/50 px-6 py-4 backdrop-blur-xl dark:border-white/5 dark:bg-[#0A2540]/50 lg:px-10">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="rounded-xl bg-black/5 p-2.5 transition-colors hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>

            {activeTab !== homeTabId ? (
              <button
                type="button"
                onClick={() => onTabChange(homeTabId)}
                className="flex items-center gap-2 rounded-xl border border-black/5 bg-slate-100 p-2.5 text-slate-600 shadow-sm transition-transform hover:scale-105 dark:border-white/5 dark:bg-[#061524] dark:text-slate-300"
              >
                <ArrowRight className="h-5 w-5" />
                <span className="hidden whitespace-nowrap text-sm font-bold md:inline">
                  {homeLabel}
                </span>
              </button>
            ) : null}

            <div className="hidden items-center gap-4 rounded-full border border-black/5 bg-white p-1.5 pr-2 shadow-sm dark:border-white/5 dark:bg-[#061524] md:flex">
              {userBadge}
            </div>
          </div>

          <div className="relative flex items-center gap-3">
            <button
              type="button"
              onClick={toggleDarkMode}
              className="rounded-full border border-black/5 bg-white p-2.5 text-slate-600 shadow-sm transition-transform hover:scale-105 dark:border-white/5 dark:bg-[#061524] dark:text-slate-300"
            >
              {isDarkMode ? <Sun className="h-5 w-5 text-[#D4AF37]" /> : <Moon className="h-5 w-5 text-[#0A2540]" />}
            </button>

            {notifications ? (
              <button
                type="button"
                onClick={() => setShowNotifications((current) => !current)}
                className="relative rounded-full border border-black/5 bg-white p-2.5 text-slate-600 shadow-sm transition-transform hover:scale-105 dark:border-white/5 dark:bg-[#061524] dark:text-slate-300"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-white bg-red-500 dark:border-[#061524]" />
              </button>
            ) : null}

            <AnimatePresence>
              {showNotifications && notifications ? (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute left-0 top-14 z-50 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#0A2540]"
                >
                  {notifications}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </header>

        <div className="relative flex-1 overflow-y-auto p-6 lg:p-10">{children}</div>
      </main>
    </div>
  );
}
