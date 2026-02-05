'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

interface AKEvent {
  id: number;
  date: string;
  event_type: string;
  pax: number;
  time_start: string;
  time_end: string;
  contact_person: string;
  room: string;
  description: string;
  menu_notes: string;
  status: string;
}

const EVENT_TYPES = [
  { value: 'brunch', label: 'Brunch', icon: '☀', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { value: 'ball', label: 'Ball', icon: '✦', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'buffet', label: 'Buffet', icon: '▤', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'bankett', label: 'Bankett', icon: '◈', color: 'bg-red-50 text-red-700 border-red-200' },
  { value: 'empfang', label: 'Empfang', icon: '◇', color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'seminar', label: 'Seminar', icon: '▣', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'sonstiges', label: 'Sonstiges', icon: '○', color: 'bg-primary-50 text-primary-700 border-primary-200' },
];

const STATUS_OPTIONS = [
  { value: 'geplant', label: 'Geplant', color: 'bg-blue-100 text-blue-700' },
  { value: 'bestaetigt', label: 'Bestätigt', color: 'bg-green-100 text-green-700' },
  { value: 'abgesagt', label: 'Abgesagt', color: 'bg-red-100 text-red-700' },
  { value: 'abgeschlossen', label: 'Abgeschlossen', color: 'bg-primary-100 text-primary-600' },
];

const emptyForm = { date: '', event_type: 'buffet', pax: 0, time_start: '', time_end: '', contact_person: '', room: '', description: '', menu_notes: '', status: 'geplant' };

export default function EventsPage() {
  const [events, setEvents] = useState<AKEvent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState<AKEvent | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [airtableStatus, setAirtableStatus] = useState<{ configured: boolean } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ synced: number; created: number; updated: number; errors: string[] } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEvents();
    // Check Airtable connection
    api.get<{ configured: boolean }>('/api/airtable?action=status')
      .then(setAirtableStatus)
      .catch(() => {});
  }, []);

  function loadEvents() {
    api.get<AKEvent[]>('/api/events')
      .then(setEvents)
      .catch(err => setError(err.message));
  }

  function handleSave() {
    const body = editEvent ? { ...form, id: editEvent.id } : form;
    const promise = editEvent
      ? api.put<void>('/api/events', body)
      : api.post<void>('/api/events', body);

    promise
      .then(() => {
        loadEvents();
        setShowForm(false);
        setEditEvent(null);
        setForm(emptyForm);
        setError('');
      })
      .catch(err => setError(err.message));
  }

  function handleDelete(id: number) {
    if (!confirm('Event wirklich löschen?')) return;
    api.delete<void>(`/api/events?id=${id}`)
      .then(() => loadEvents())
      .catch(err => setError(err.message));
  }

  function startEdit(event: AKEvent) {
    setEditEvent(event);
    setForm({
      date: event.date,
      event_type: event.event_type,
      pax: event.pax,
      time_start: event.time_start || '',
      time_end: event.time_end || '',
      contact_person: event.contact_person || '',
      room: event.room || '',
      description: event.description,
      menu_notes: event.menu_notes,
      status: event.status || 'geplant',
    });
    setShowForm(true);
  }

  const today = new Date().toISOString().split('T')[0];
  const filtered = events
    .filter(e => !filterType || e.event_type === filterType)
    .filter(e => !filterStatus || e.status === filterStatus)
    .sort((a, b) => {
      const aFuture = a.date >= today ? 0 : 1;
      const bFuture = b.date >= today ? 0 : 1;
      if (aFuture !== bFuture) return aFuture - bFuture;
      // Future: ascending (next event first), past: descending (most recent first)
      return aFuture === 0
        ? a.date.localeCompare(b.date) || (a.time_start || '').localeCompare(b.time_start || '')
        : b.date.localeCompare(a.date) || (b.time_start || '').localeCompare(a.time_start || '');
    });

  // Stats
  const upcoming = events.filter(e => e.status === 'geplant' || e.status === 'bestaetigt').length;
  const totalPax = events.filter(e => e.status !== 'abgesagt').reduce((sum, e) => sum + e.pax, 0);

  return (
    <div className="space-y-5">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 font-bold">×</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">AK Events</h1>
          <p className="text-sm text-primary-500 mt-1">Arbeiterkammer Veranstaltungen verwalten</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditEvent(null); setForm(emptyForm); }}
          className="flex items-center gap-2 bg-accent-500 text-primary-900 px-5 py-2.5 rounded-lg hover:bg-accent-400 font-semibold transition-colors shadow-sm"
        >
          <span className="text-lg">+</span>
          Neues Event
        </button>
      </div>

      {/* Airtable Sync */}
      {airtableStatus && (
        <div className={`rounded-card border p-4 flex items-center justify-between ${
          airtableStatus.configured
            ? 'bg-green-50 border-green-200'
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-xl">{airtableStatus.configured ? '⚡' : '⚠'}</span>
            <div>
              <div className="font-medium text-sm text-primary-900">
                {airtableStatus.configured ? 'Airtable verbunden' : 'Airtable nicht konfiguriert'}
              </div>
              <div className="text-xs text-primary-500">
                {airtableStatus.configured
                  ? 'Events können synchronisiert werden'
                  : 'AIRTABLE_API_KEY und AIRTABLE_BASE_ID in .env.local setzen'
                }
              </div>
            </div>
          </div>
          {airtableStatus.configured && (
            <button
              onClick={async () => {
                setSyncing(true);
                setSyncResult(null);
                try {
                  const data = await api.get<{ synced: number; created: number; updated: number; errors: string[] }>('/api/airtable?action=sync');
                  setSyncResult(data);
                  loadEvents();
                } catch (err) {
                  setSyncResult({ synced: 0, created: 0, updated: 0, errors: [err instanceof Error ? err.message : 'Verbindungsfehler'] });
                }
                setSyncing(false);
              }}
              disabled={syncing}
              className="px-4 py-2 bg-accent-500 text-primary-900 rounded-lg hover:bg-accent-400 font-semibold text-sm transition-colors disabled:opacity-50 shadow-sm"
            >
              {syncing ? 'Synchronisiere...' : 'Jetzt synchronisieren'}
            </button>
          )}
        </div>
      )}

      {syncResult && (
        <div className={`rounded-card border p-3 text-sm ${syncResult.errors.length > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          {syncResult.errors.length > 0 ? (
            <div className="text-red-700">{syncResult.errors.join(', ')}</div>
          ) : (
            <div className="text-green-700">
              Sync abgeschlossen: {syncResult.created} neu, {syncResult.updated} aktualisiert ({syncResult.synced} Datensätze)
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-card shadow-card border border-primary-100 p-4">
          <div className="text-xs text-primary-500 font-medium uppercase tracking-wide">Gesamt Events</div>
          <div className="text-2xl font-bold text-primary-900 mt-1">{events.length}</div>
        </div>
        <div className="bg-white rounded-card shadow-card border border-primary-100 p-4">
          <div className="text-xs text-primary-500 font-medium uppercase tracking-wide">Anstehend</div>
          <div className="text-2xl font-bold text-accent-600 mt-1">{upcoming}</div>
        </div>
        <div className="bg-white rounded-card shadow-card border border-primary-100 p-4">
          <div className="text-xs text-primary-500 font-medium uppercase tracking-wide">Gesamt PAX</div>
          <div className="text-2xl font-bold text-primary-900 mt-1">{totalPax}</div>
        </div>
        <div className="bg-white rounded-card shadow-card border border-primary-100 p-4">
          <div className="text-xs text-primary-500 font-medium uppercase tracking-wide">Ø PAX/Event</div>
          <div className="text-2xl font-bold text-primary-900 mt-1">
            {events.length > 0 ? Math.round(totalPax / events.filter(e => e.status !== 'abgesagt').length || 1) : 0}
          </div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-card shadow-card border border-primary-100 p-6 space-y-5">
          <h3 className="font-bold text-primary-900 text-lg">
            {editEvent ? 'Event bearbeiten' : 'Neues Event anlegen'}
          </h3>

          {/* Event Type Selection */}
          <div>
            <label className="text-sm font-medium text-primary-700 mb-2 block">Event-Typ</label>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setForm({ ...form, event_type: t.value })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                    form.event_type === t.value
                      ? 'bg-accent-50 border-accent-500 text-accent-800 shadow-sm'
                      : 'border-primary-200 text-primary-600 hover:border-primary-300'
                  }`}
                >
                  <span>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-primary-700 mb-1 block">Datum</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full border border-primary-200 rounded-lg px-4 py-2.5 focus:border-accent-500 focus:ring-2 focus:ring-accent-100 outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-primary-700 mb-1 block">Von</label>
              <input type="time" value={form.time_start} onChange={e => setForm({ ...form, time_start: e.target.value })}
                className="w-full border border-primary-200 rounded-lg px-4 py-2.5 focus:border-accent-500 focus:ring-2 focus:ring-accent-100 outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-primary-700 mb-1 block">Bis</label>
              <input type="time" value={form.time_end} onChange={e => setForm({ ...form, time_end: e.target.value })}
                className="w-full border border-primary-200 rounded-lg px-4 py-2.5 focus:border-accent-500 focus:ring-2 focus:ring-accent-100 outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-primary-700 mb-1 block">Personenanzahl (PAX)</label>
              <input type="number" placeholder="z.B. 120" value={form.pax || ''} onChange={e => setForm({ ...form, pax: parseInt(e.target.value) || 0 })}
                className="w-full border border-primary-200 rounded-lg px-4 py-2.5 focus:border-accent-500 focus:ring-2 focus:ring-accent-100 outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-primary-700 mb-1 block">Ansprechperson</label>
              <input type="text" placeholder="Name der Kontaktperson" value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })}
                className="w-full border border-primary-200 rounded-lg px-4 py-2.5 focus:border-accent-500 focus:ring-2 focus:ring-accent-100 outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-primary-700 mb-1 block">Raum</label>
              <input type="text" placeholder="z.B. Großer Saal" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })}
                className="w-full border border-primary-200 rounded-lg px-4 py-2.5 focus:border-accent-500 focus:ring-2 focus:ring-accent-100 outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-primary-700 mb-1 block">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full border border-primary-200 rounded-lg px-4 py-2.5 focus:border-accent-500 focus:ring-2 focus:ring-accent-100 outline-none">
                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-primary-700 mb-1 block">Beschreibung</label>
              <input type="text" placeholder="Kurzbeschreibung des Events" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full border border-primary-200 rounded-lg px-4 py-2.5 focus:border-accent-500 focus:ring-2 focus:ring-accent-100 outline-none" />
            </div>
            <div className="md:col-span-3">
              <label className="text-sm font-medium text-primary-700 mb-1 block">Menü-Notizen</label>
              <textarea placeholder="Besondere Wünsche, Menü-Details, Allergien der Gäste..." value={form.menu_notes} onChange={e => setForm({ ...form, menu_notes: e.target.value })}
                className="w-full border border-primary-200 rounded-lg px-4 py-2.5 focus:border-accent-500 focus:ring-2 focus:ring-accent-100 outline-none" rows={3} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={handleSave}
              className="bg-accent-500 text-primary-900 px-6 py-2.5 rounded-lg hover:bg-accent-400 font-semibold transition-colors shadow-sm">
              Speichern
            </button>
            <button onClick={() => { setShowForm(false); setEditEvent(null); setForm(emptyForm); }}
              className="bg-primary-100 text-primary-700 px-6 py-2.5 rounded-lg hover:bg-primary-200 font-medium transition-colors">
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-primary-500 font-medium mr-2">Filter:</span>
        <button
          onClick={() => setFilterType('')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${!filterType ? 'bg-primary-800 text-white' : 'bg-primary-100 text-primary-600 hover:bg-primary-200'}`}
        >
          Alle Typen
        </button>
        {EVENT_TYPES.map(t => (
          <button key={t.value} onClick={() => setFilterType(filterType === t.value ? '' : t.value)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
              filterType === t.value ? 'bg-accent-500 text-primary-900' : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
            }`}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
        <span className="text-primary-300 mx-2">|</span>
        {STATUS_OPTIONS.map(s => (
          <button key={s.value} onClick={() => setFilterStatus(filterStatus === s.value ? '' : s.value)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === s.value ? 'bg-accent-500 text-primary-900' : `${s.color}`
            }`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Event Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-card shadow-card border border-primary-100 p-12 text-center">
          <div className="text-primary-400 text-lg mb-2">Keine Events vorhanden</div>
          <p className="text-sm text-primary-500">Erstelle ein neues Event um loszulegen.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(event => {
            const typeInfo = EVENT_TYPES.find(t => t.value === event.event_type) || EVENT_TYPES[6];
            const statusInfo = STATUS_OPTIONS.find(s => s.value === event.status) || STATUS_OPTIONS[0];

            return (
              <div key={event.id} className="bg-white rounded-card shadow-card border border-primary-100 overflow-hidden hover:shadow-card-hover transition-shadow">
                <div className="flex items-stretch">
                  {/* Left color bar */}
                  <div className={`w-1.5 ${
                    event.status === 'bestaetigt' ? 'bg-green-500' :
                    event.status === 'abgesagt' ? 'bg-red-400' :
                    event.status === 'abgeschlossen' ? 'bg-primary-400' :
                    'bg-accent-500'
                  }`} />

                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        {/* Date block */}
                        <div className="text-center bg-primary-50 rounded-lg p-3 min-w-[70px]">
                          <div className="text-xs text-primary-500 font-medium">
                            {event.date ? new Date(event.date + 'T00:00:00').toLocaleDateString('de-AT', { weekday: 'short' }) : ''}
                          </div>
                          <div className="text-xl font-bold text-primary-900">
                            {event.date ? new Date(event.date + 'T00:00:00').getDate() : ''}
                          </div>
                          <div className="text-xs text-primary-500">
                            {event.date ? new Date(event.date + 'T00:00:00').toLocaleDateString('de-AT', { month: 'short' }) : ''}
                          </div>
                        </div>

                        {/* Event info */}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${typeInfo.color}`}>
                              {typeInfo.icon} {typeInfo.label}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                            <span className="bg-accent-100 text-accent-800 px-2 py-0.5 rounded-full text-xs font-bold">
                              {event.pax} PAX
                            </span>
                          </div>
                          <div className="text-primary-900 font-medium">
                            {event.description || `${typeInfo.label} - ${event.date}`}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-primary-500">
                            {(event.time_start || event.time_end) && (
                              <span>{event.time_start}{event.time_end ? ` - ${event.time_end}` : ''}</span>
                            )}
                            {event.contact_person && <span>Kontakt: {event.contact_person}</span>}
                            {event.room && <span>Raum: {event.room}</span>}
                          </div>
                          {event.menu_notes && (
                            <div className="mt-2 text-xs text-primary-600 bg-primary-50 rounded px-3 py-2 border-l-2 border-accent-400">
                              {event.menu_notes}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => startEdit(event)}
                          className="text-xs px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors font-medium">
                          Bearbeiten
                        </button>
                        <button onClick={() => handleDelete(event.id)}
                          className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium">
                          Löschen
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
