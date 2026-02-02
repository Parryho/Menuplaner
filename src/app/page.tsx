'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Event {
  id: number;
  date: string;
  event_type: string;
  pax: number;
  time_start: string;
  time_end: string;
  description: string;
  status: string;
}

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [currentYear, setCurrentYear] = useState(2026);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
    const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    setCurrentWeek(week);

    fetch('/api/init')
      .then(() => fetch('/api/events'))
      .then(r => r.json())
      .then(data => {
        setEvents(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const rotationWeek = ((currentWeek - 1) % 6) + 1;
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingEvents = events
    .filter(e => e.date >= todayStr && e.status !== 'abgesagt')
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time_start || '').localeCompare(b.time_start || ''))
    .slice(0, 4);

  // Get current date info
  const today = new Date();
  const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary-900">Dashboard</h1>
            <p className="text-primary-600 mt-1">Willkommen im Menüplan-Generator</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-primary-600">
              {dayNames[today.getDay()]}, {today.getDate()}. {monthNames[today.getMonth()]} {currentYear}
            </div>
            <div className="text-xs text-primary-500 mt-0.5">
              Kalenderwoche {currentWeek}
            </div>
          </div>
        </div>
      </div>

      {/* Current Week Status - Prominent Hero Section */}
      <div className="bg-gradient-to-br from-primary-800 to-primary-900 rounded-card shadow-elevated p-8 text-white">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="text-primary-300 text-sm font-medium uppercase tracking-wide mb-2">
              Aktuelle Woche
            </div>
            <div className="text-5xl font-bold mb-2">KW {currentWeek}</div>
            <div className="text-xl text-primary-200 mb-6">
              Rotationswoche {rotationWeek} / 6
            </div>
            <Link
              href={`/wochenplan?week=${currentWeek}&year=${currentYear}`}
              className="inline-flex items-center gap-2 bg-accent-500 text-primary-900 px-6 py-3 rounded-lg font-semibold hover:bg-accent-400 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <span>Wochenplan öffnen</span>
              <span className="text-xl">→</span>
            </Link>
          </div>
          <div className="flex flex-col justify-center">
            <div className="bg-primary-700/50 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-xs text-primary-300 uppercase tracking-wide mb-2">Rotationsstatus</div>
              <div className="flex gap-1.5 mb-3">
                {[1, 2, 3, 4, 5, 6].map((w) => (
                  <div
                    key={w}
                    className={`h-2 flex-1 rounded-full transition-all ${
                      w === rotationWeek
                        ? 'bg-accent-500'
                        : w < rotationWeek
                        ? 'bg-primary-500'
                        : 'bg-primary-600'
                    }`}
                    title={`Woche ${w}`}
                  />
                ))}
              </div>
              <div className="text-sm text-primary-200">
                Woche {rotationWeek} von 6 im Zyklus
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-primary-900 mb-4">Schnellzugriff</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href={`/wochenplan?week=${currentWeek}&year=${currentYear}`}
            className="group bg-white rounded-card shadow-card hover:shadow-card-hover p-6 transition-all border border-transparent hover:border-accent-500"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center text-2xl text-accent-600 group-hover:bg-accent-500 group-hover:text-white transition-colors">
                ☰
              </div>
              <div className="text-xs text-primary-500 font-medium">KW {currentWeek}</div>
            </div>
            <div className="font-bold text-primary-900 mb-1">Wochenplan</div>
            <div className="text-sm text-primary-600">Aktuelle Woche anzeigen</div>
          </Link>

          <Link
            href="/rotation"
            className="group bg-white rounded-card shadow-card hover:shadow-card-hover p-6 transition-all border border-transparent hover:border-accent-500"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center text-2xl text-success-600 group-hover:bg-success-500 group-hover:text-white transition-colors">
                ⟳
              </div>
              <div className="text-xs text-primary-500 font-medium">W{rotationWeek}/6</div>
            </div>
            <div className="font-bold text-primary-900 mb-1">Rotation</div>
            <div className="text-sm text-primary-600">6-Wochen-Vorlagen</div>
          </Link>

          <Link
            href="/gerichte"
            className="group bg-white rounded-card shadow-card hover:shadow-card-hover p-6 transition-all border border-transparent hover:border-accent-500"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 bg-info-100 rounded-lg flex items-center justify-center text-2xl text-info-600 group-hover:bg-info-500 group-hover:text-white transition-colors">
                ⊞
              </div>
            </div>
            <div className="font-bold text-primary-900 mb-1">Gerichte</div>
            <div className="text-sm text-primary-600">Stammdaten verwalten</div>
          </Link>

          <Link
            href={`/export?week=${currentWeek}&year=${currentYear}`}
            className="group bg-white rounded-card shadow-card hover:shadow-card-hover p-6 transition-all border border-transparent hover:border-accent-500"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center text-2xl text-accent-600 group-hover:bg-accent-500 group-hover:text-white transition-colors">
                ⬇
              </div>
            </div>
            <div className="font-bold text-primary-900 mb-1">Export</div>
            <div className="text-sm text-primary-600">Excel & CSV Download</div>
          </Link>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Events (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Events */}
          <div className="bg-white rounded-card shadow-card border border-primary-100">
            <div className="px-6 py-4 border-b border-primary-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg text-primary-900">Nächste AK-Events</h2>
                <p className="text-sm text-primary-600 mt-0.5">Arbeiterkammer Veranstaltungen</p>
              </div>
              <Link
                href="/events"
                className="text-sm text-accent-600 hover:text-accent-700 font-medium hover:underline"
              >
                Alle Events →
              </Link>
            </div>
            <div className="p-6">
              {isLoading ? (
                <div className="text-center py-8 text-primary-500">Lade Events...</div>
              ) : upcomingEvents.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-primary-400 mb-2">Keine Events vorhanden</div>
                  <Link
                    href="/events"
                    className="text-accent-600 hover:text-accent-700 text-sm font-medium hover:underline"
                  >
                    Neues Event erstellen →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-4 p-4 bg-primary-50 rounded-lg border border-primary-100 hover:border-accent-200 hover:bg-accent-50/30 transition-colors"
                    >
                      <div className="flex-shrink-0 text-center">
                        <div className="text-sm font-bold text-primary-900 w-24">
                          {new Date(event.date + 'T00:00').toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        </div>
                        {event.time_start && <div className="text-xs text-primary-600 mt-0.5">{event.time_start}{event.time_end ? ` - ${event.time_end}` : ''}</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-primary-900 capitalize">{event.event_type}</span>
                          <span className="text-xs bg-accent-100 text-accent-700 px-2 py-0.5 rounded font-medium">
                            {event.pax} PAX
                          </span>
                        </div>
                        <div className="text-sm text-primary-600 truncate">{event.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Allergen Legend */}
          <div className="bg-white rounded-card shadow-card border border-primary-100">
            <div className="px-6 py-4 border-b border-primary-100">
              <h2 className="font-bold text-lg text-primary-900">Allergen-Kennzeichnung</h2>
              <p className="text-sm text-primary-600 mt-0.5">EU-Verordnung 1169/2011</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { code: 'A', name: 'Gluten' },
                  { code: 'B', name: 'Krebstiere' },
                  { code: 'C', name: 'Eier' },
                  { code: 'D', name: 'Fisch' },
                  { code: 'E', name: 'Erdnüsse' },
                  { code: 'F', name: 'Soja' },
                  { code: 'G', name: 'Milch/Laktose' },
                  { code: 'H', name: 'Schalenfrüchte' },
                  { code: 'L', name: 'Sellerie' },
                  { code: 'M', name: 'Senf' },
                  { code: 'N', name: 'Sesam' },
                  { code: 'O', name: 'Sulfite' },
                  { code: 'P', name: 'Lupinen' },
                  { code: 'R', name: 'Weichtiere' },
                ].map(({ code, name }) => (
                  <div key={code} className="flex items-center gap-2">
                    <span className="bg-danger-500 text-white font-bold px-2 py-1 rounded text-xs w-7 text-center flex-shrink-0">
                      {code}
                    </span>
                    <span className="text-sm text-primary-700">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Rotation Overview (1/3 width) */}
        <div className="space-y-6">
          <div className="bg-white rounded-card shadow-card border border-primary-100">
            <div className="px-6 py-4 border-b border-primary-100">
              <h2 className="font-bold text-lg text-primary-900">Rotations-Übersicht</h2>
              <p className="text-sm text-primary-600 mt-0.5">6-Wochen-Zyklus</p>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {[1, 2, 3, 4, 5, 6].map((w) => {
                  const isActive = w === rotationWeek;
                  const isPast = w < rotationWeek;

                  return (
                    <Link
                      key={w}
                      href={`/rotation?week=${w}`}
                      className={`block p-4 rounded-lg border-2 transition-all ${
                        isActive
                          ? 'bg-accent-50 border-accent-500 shadow-md'
                          : isPast
                          ? 'bg-primary-50 border-primary-200 hover:border-primary-300'
                          : 'bg-white border-primary-200 hover:border-accent-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`font-bold ${isActive ? 'text-accent-700' : 'text-primary-900'}`}>
                            Woche {w}
                          </div>
                          {isActive && (
                            <div className="text-xs text-accent-600 font-medium mt-1">
                              Aktuelle Rotation
                            </div>
                          )}
                          {isPast && (
                            <div className="text-xs text-primary-500 mt-1">
                              Abgeschlossen
                            </div>
                          )}
                        </div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          isActive
                            ? 'bg-accent-500 text-white'
                            : isPast
                            ? 'bg-primary-300 text-white'
                            : 'bg-primary-100 text-primary-600'
                        }`}>
                          {w}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-accent-500 to-accent-600 rounded-card shadow-card p-6 text-white">
            <div className="text-sm font-medium uppercase tracking-wide text-accent-100 mb-3">
              System Status
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Datenbank</span>
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <span className="w-2 h-2 bg-success-400 rounded-full"></span>
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Events gesamt</span>
                <span className="text-lg font-bold">{events.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Letzte Aktualisierung</span>
                <span className="text-xs">{today.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
