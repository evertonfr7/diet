"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BarChart2, Settings, Leaf } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/resumo", label: "Analytics", icon: BarChart2 },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-60 bg-white border-r border-gray-100 shadow-sm z-30">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-gray-100 flex items-center gap-2">
          <Leaf size={18} className="text-[#1A3A2A]" strokeWidth={2} />
          <div>
            <span className="font-bold text-[#1A3A2A] text-lg tracking-tight leading-none">
              Clinical Diet
            </span>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mt-0.5">
              Nutrição Clínica
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-green-50 text-green-700 border-l-2 border-green-600 pl-[10px]"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 px-3">Diet Monitor · v2.0</p>
        </div>
      </aside>

      {/* Mobile Top Bar (logo only) */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-100 z-30 flex items-center px-4 gap-2">
        <Leaf size={16} className="text-[#1A3A2A]" strokeWidth={2} />
        <span className="font-bold text-[#1A3A2A] text-base">Clinical Diet</span>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 z-30 flex items-center">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors ${
                active ? "text-green-700" : "text-gray-400 hover:text-gray-700"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className={`text-[10px] font-medium ${active ? "text-green-700" : "text-gray-400"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
