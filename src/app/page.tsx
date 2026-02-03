'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

function getISOWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

const NAV_CARDS = [
  { href: '/wochenplan', label: 'Wochenplan', icon: '☰', desc: 'Aktuelle Woche bearbeiten', accent: true },
  { href: '/gerichte', label: 'Gerichte', icon: '⊞', desc: 'Stammdaten & Rezepte' },
  { href: '/zutaten', label: 'Zutaten', icon: '⊕', desc: 'Zutaten & Preise' },
  { href: '/rotation', label: 'Rotation', icon: '⟳', desc: '6-Wochen-Vorlagen' },
  { href: '/produktionsliste', label: 'Produktion', icon: '⚙', desc: 'Mengen × PAX' },
  { href: '/einkaufsliste', label: 'Einkauf', icon: '☐', desc: 'Wocheneinkauf' },
  { href: '/kosten', label: 'Kosten', icon: '€', desc: 'Wareneinsatz' },
  { href: '/events', label: 'AK Events', icon: '◉', desc: 'Arbeiterkammer' },
  { href: '/felix', label: 'Felix OCR', icon: '⚡', desc: 'Gästezahlen' },
  { href: '/druck', label: 'Druck', icon: '⎙', desc: 'Druckvorschau' },
  { href: '/export', label: 'Export', icon: '⬇', desc: 'Excel & CSV' },
];

export default function Dashboard() {
  const [currentWeek, setCurrentWeek] = useState(1);
  const [currentYear, setCurrentYear] = useState(2026);

  useEffect(() => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentWeek(getISOWeek(now));
    // Init DB
    fetch('/api/init').catch(() => {});
  }, []);

  const rotationWeek = ((currentWeek - 1) % 6) + 1;
  const today = new Date();
  const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const monthNames = ['Jänner', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-800 to-primary-900 rounded-card shadow-elevated p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-primary-400 text-sm">
              {dayNames[today.getDay()]}, {today.getDate()}. {monthNames[today.getMonth()]} {currentYear}
            </div>
            <div className="text-3xl font-bold mt-1">KW {currentWeek}</div>
            <div className="text-primary-300 text-sm mt-1">Rotation {rotationWeek}/6</div>
          </div>
          <Link
            href={`/wochenplan?week=${currentWeek}&year=${currentYear}`}
            className="bg-accent-500 text-primary-900 px-6 py-3 rounded-lg font-semibold hover:bg-accent-400 transition-colors shadow-lg"
          >
            Wochenplan öffnen →
          </Link>
        </div>
      </div>

      {/* Navigation Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {NAV_CARDS.map(item => (
          <Link
            key={item.href}
            href={item.href.includes('wochenplan') ? `${item.href}?week=${currentWeek}&year=${currentYear}` : item.href}
            className={`group p-4 rounded-card border transition-all hover:shadow-md ${
              item.accent
                ? 'bg-accent-50 border-accent-200 hover:border-accent-400'
                : 'bg-white border-primary-100 hover:border-primary-300'
            }`}
          >
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform inline-block">{item.icon}</div>
            <div className="font-bold text-primary-900 text-sm">{item.label}</div>
            <div className="text-xs text-primary-500 mt-0.5">{item.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
