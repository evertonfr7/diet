"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "⊞" },
  { href: "/resumo", label: "Analytics", icon: "↗" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-60 bg-white border-r border-gray-100 shadow-sm z-30">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-gray-100">
          <span className="font-bold text-[#1A3A2A] text-lg tracking-tight">
            🌿 Clinical Diet
          </span>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mt-0.5">
            Nutrição Clínica
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon }) => {
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
                <span className="text-base">{icon}</span>
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

      {/* Mobile Top Bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-100 z-30 flex items-center px-4 gap-6">
        <span className="font-bold text-[#1A3A2A] text-base">🌿 Diet</span>
        {NAV_ITEMS.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`text-sm font-medium transition-colors ${
                active ? "text-green-600" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </header>
    </>
  );
}
