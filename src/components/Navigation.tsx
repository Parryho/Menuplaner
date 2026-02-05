'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV_ITEMS = [
  {
    href: '/',
    label: 'Dashboard',
    icon: '◼', // Dashboard icon
    description: 'Übersicht'
  },
  {
    href: '/wochenplan',
    label: 'Wochenplan',
    icon: '☰', // Calendar icon
    description: 'Wochenplanung'
  },
  {
    href: '/rotation',
    label: 'Rotation',
    icon: '⟳', // Rotation icon
    description: '6-Wochen-Zyklus'
  },
  {
    href: '/gerichte',
    label: 'Gerichte',
    icon: '⊞', // Database icon
    description: 'Stammdaten'
  },
  {
    href: '/events',
    label: 'AK Events',
    icon: '◉', // Event icon
    description: 'Arbeiterkammer'
  },
  {
    href: '/felix',
    label: 'Felix OCR',
    icon: '⚡', // Lightning icon
    description: 'OCR-Scanner'
  },
  {
    href: '/produktionsliste',
    label: 'Produktion',
    icon: '\u2699', // Gear icon
    description: 'Produktionslisten'
  },
  {
    href: '/einkaufsliste',
    label: 'Einkauf',
    icon: '\u2610', // Checkbox icon
    description: 'Einkaufslisten'
  },
  {
    href: '/kosten',
    label: 'Kosten',
    icon: '\u20AC', // Euro icon
    description: 'Wareneinsatz'
  },
  {
    href: '/zutaten',
    label: 'Zutaten',
    icon: '\u2295', // Plus circle icon
    description: 'Stammdaten'
  },
  {
    href: '/export',
    label: 'Export',
    icon: '\u2B07', // Download icon
    description: 'Excel & CSV'
  },
  {
    href: '/druck',
    label: 'Druck',
    icon: '⎙', // Print icon
    description: 'Druckvorschau'
  },
];

export default function Navigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Hide navigation on login page
  if (pathname === '/login') return null;

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-primary-800 text-white print:hidden fixed top-0 left-0 right-0 z-50 shadow-elevated">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center font-bold text-primary-900">
              M
            </div>
            <div>
              <div className="font-bold text-lg leading-none">Menüplan-Generator</div>
              <div className="text-xs text-primary-300 mt-0.5">JUFA Hotel Graz</div>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-primary-700 rounded-lg transition-colors"
            aria-label="Menü öffnen"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="border-t border-primary-700 bg-primary-800">
            <nav className="px-2 py-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      isActive
                        ? 'bg-accent-500 text-primary-900 font-semibold shadow-lg'
                        : 'text-white hover:bg-primary-700'
                    }`}
                  >
                    <span className="text-xl w-6 text-center">{item.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium">{item.label}</div>
                      <div className={`text-xs ${isActive ? 'text-primary-800' : 'text-primary-400'}`}>
                        {item.description}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-64 bg-primary-800 text-white print:hidden shadow-elevated z-40">
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="px-6 py-6 border-b border-primary-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-accent-500 rounded-lg flex items-center justify-center font-bold text-xl text-primary-900">
                M
              </div>
              <div>
                <div className="font-bold text-lg leading-none">Menüplan</div>
                <div className="text-xs text-primary-400 mt-1">Generator</div>
              </div>
            </div>
            <div className="text-xs text-primary-400 mt-2 pl-0.5">
              JUFA Hotel Graz
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all group ${
                    isActive
                      ? 'bg-accent-500 text-primary-900 font-semibold shadow-lg'
                      : 'text-primary-200 hover:bg-primary-700 hover:text-white'
                  }`}
                >
                  <span className={`text-xl w-6 text-center transition-transform group-hover:scale-110 ${
                    isActive ? 'text-primary-900' : 'text-accent-500'
                  }`}>
                    {item.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium truncate ${isActive ? 'text-primary-900' : ''}`}>
                      {item.label}
                    </div>
                    <div className={`text-xs truncate ${
                      isActive ? 'text-primary-800' : 'text-primary-400 group-hover:text-primary-300'
                    }`}>
                      {item.description}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 border-t border-primary-700">
            <button
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                window.location.href = '/login';
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-primary-300 hover:text-white hover:bg-primary-700 rounded-lg transition-colors"
            >
              <span>&#x2190;</span>
              <span>Abmelden</span>
            </button>
            <div className="flex items-center justify-between mt-2 px-3 text-xs text-primary-500">
              <span>v1.0</span>
              <span>{new Date().getFullYear()}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
