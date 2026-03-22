'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-6">
        <span className="font-bold text-green-600 text-lg">🥗 Diet</span>
        <Link
          href="/"
          className={`text-sm font-medium transition-colors ${
            pathname === '/' ? 'text-green-600' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Hoje
        </Link>
        <Link
          href="/resumo"
          className={`text-sm font-medium transition-colors ${
            pathname === '/resumo' ? 'text-green-600' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Resumo
        </Link>
      </div>
    </nav>
  )
}
