import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

function ensureDb() {
  seedDatabase();
}

// Airtable API integration (READ-ONLY - niemals nach Airtable schreiben!)
// Configure via environment variables:
// AIRTABLE_API_KEY = your personal access token
// AIRTABLE_BASE_ID = your base ID (starts with app...)
// AIRTABLE_TABLE_NAME = table name (default: "Catering Events")

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || '';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || '';
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'Catering Events';

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

interface AirtableResponse {
  records: AirtableRecord[];
  offset?: string;
}

// --- Helper functions ---

/** Safe field access - returns '' for arrays (linked record IDs), null, undefined */
function getField(record: AirtableRecord, fieldName: string): string {
  const val = record.fields[fieldName];
  if (val === null || val === undefined) return '';
  if (Array.isArray(val)) return ''; // Location, Client, Staff are record-ID arrays
  return String(val);
}

/** Extract PAX from free text. Patterns: "48 PAX", "ca. 200 pax", "200 Personen", "fuer 80" */
function extractPax(...texts: string[]): number {
  for (const text of texts) {
    if (!text) continue;
    // "48 PAX", "ca. 200 PAX", "200 Pax"
    const paxMatch = text.match(/(?:ca\.?\s*)?(\d+)\s*pax/i);
    if (paxMatch) return parseInt(paxMatch[1]);
    // "200 Personen", "80 Pers."
    const persMatch = text.match(/(?:ca\.?\s*)?(\d+)\s*pers(?:onen|\.)?/i);
    if (persMatch) return parseInt(persMatch[1]);
    // "fuer 80", "für 80"
    const fuerMatch = text.match(/f[uü]r\s+(\d+)/i);
    if (fuerMatch) return parseInt(fuerMatch[1]);
  }
  return 0;
}

/** Extract date from text like "05.02. - 08.02." or "05.02.2026". Returns ISO date (YYYY-MM-DD) or '' */
function extractDateFromText(text: string): string {
  if (!text) return '';
  const currentYear = new Date().getFullYear();
  // "05.02.2026" or "05.02.26"
  const fullMatch = text.match(/(\d{1,2})\.(\d{1,2})\.(\d{2,4})/);
  if (fullMatch) {
    const day = fullMatch[1].padStart(2, '0');
    const month = fullMatch[2].padStart(2, '0');
    let year = fullMatch[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }
  // "05.02." (without year - assume current year)
  const shortMatch = text.match(/(\d{1,2})\.(\d{1,2})\./);
  if (shortMatch) {
    const day = shortMatch[1].padStart(2, '0');
    const month = shortMatch[2].padStart(2, '0');
    return `${currentYear}-${month}-${day}`;
  }
  return '';
}

/** Extract all times from Event Time field. Returns {timeStart, timeEnd, rest} */
function extractTimesFromField(value: string): { timeStart: string; timeEnd: string; rest: string } {
  if (!value) return { timeStart: '', timeEnd: '', rest: '' };
  // Find all time patterns: "18:00", "18.00", "18:00 Uhr", "02.00"
  const timeRegex = /(\d{1,2})[.:](\d{2})(?:\s*Uhr)?/g;
  const times: string[] = [];
  let rest = value;
  let match;
  while ((match = timeRegex.exec(value)) !== null) {
    const hours = parseInt(match[1]);
    // Skip matches that look like dates (e.g. "05.02." where next char is ".")
    const afterMatch = value.substring(match.index + match[0].length);
    if (afterMatch.startsWith('.')) continue;
    if (hours > 24) continue;
    times.push(`${match[1].padStart(2, '0')}:${match[2]}`);
    rest = rest.replace(match[0], '').trim();
  }
  // Clean up separators left behind
  rest = rest.replace(/^[\s,;:\-–|/]+|[\s,;:\-–|/]+$/g, '').replace(/\s{2,}/g, ' ').trim();
  return {
    timeStart: times[0] || '',
    timeEnd: times[1] || '',
    rest,
  };
}

/** Map Airtable "Type of Event" to DB enum */
function mapEventType(airtableType: string): string {
  if (!airtableType) return 'sonstiges';
  const t = airtableType.toLowerCase().trim();

  if (t.includes('brunch')) return 'brunch';
  if (t.includes('ball')) return 'ball';
  if (t.includes('buffet')) return 'buffet';
  if (t.includes('bankett')) return 'bankett';
  if (t.includes('empfang') || t.includes('reception')) return 'empfang';
  if (t.includes('seminar') || t.includes('tagung') || t.includes('konferenz') || t.includes('workshop')) return 'seminar';
  // "AK organisiert" and anything else
  return 'sonstiges';
}

/** Map Airtable Status to DB enum */
function mapStatus(airtableStatus: string): string {
  if (!airtableStatus) return 'geplant';
  const s = airtableStatus.toLowerCase().trim();

  if (s === 'scheduled' || s === 'geplant') return 'geplant';
  if (s === 'confirmed' || s === 'bestaetigt' || s === 'bestätigt') return 'bestaetigt';
  if (s === 'cancelled' || s === 'canceled' || s === 'abgesagt') return 'abgesagt';
  if (s === 'completed' || s === 'abgeschlossen') return 'abgeschlossen';
  return 'geplant';
}

// GET: Sync events from Airtable
export async function GET(request: NextRequest) {
  ensureDb();
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'status';

  if (action === 'status') {
    return NextResponse.json({
      configured: !!(AIRTABLE_API_KEY && AIRTABLE_BASE_ID),
      baseId: AIRTABLE_BASE_ID ? `${AIRTABLE_BASE_ID.slice(0, 6)}...` : '',
      tableName: AIRTABLE_TABLE_NAME,
    });
  }

  if (action === 'sync') {
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      return NextResponse.json({
        error: 'Airtable nicht konfiguriert. Setze AIRTABLE_API_KEY und AIRTABLE_BASE_ID in .env.local',
      }, { status: 400 });
    }

    try {
      const records = await fetchAllAirtableRecords();
      const result = syncToDatabase(records);
      return NextResponse.json(result);
    } catch (err) {
      return NextResponse.json({
        error: `Airtable-Fehler: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`,
      }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Unbekannte Aktion' }, { status: 400 });
}

// POST: Test connection and show available fields
export async function POST(request: NextRequest) {
  ensureDb();
  const body = await request.json();
  const { apiKey, baseId, tableName } = body;

  const testKey = apiKey || AIRTABLE_API_KEY;
  const testBase = baseId || AIRTABLE_BASE_ID;
  const testTable = tableName || AIRTABLE_TABLE_NAME;

  if (!testKey || !testBase) {
    return NextResponse.json({ error: 'API Key und Base ID erforderlich' }, { status: 400 });
  }

  try {
    const url = `https://api.airtable.com/v0/${testBase}/${encodeURIComponent(testTable)}?maxRecords=1`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${testKey}` },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        error: `Airtable Verbindung fehlgeschlagen: ${response.status} - ${errorText}`,
      }, { status: 400 });
    }

    const data = await response.json() as AirtableResponse;
    const sampleFields = data.records.length > 0 ? Object.keys(data.records[0].fields) : [];

    return NextResponse.json({
      ok: true,
      message: 'Verbindung erfolgreich',
      availableFields: sampleFields,
      recordCount: data.records.length,
    });
  } catch (err) {
    return NextResponse.json({
      error: `Verbindungsfehler: ${err instanceof Error ? err.message : 'Unbekannt'}`,
    }, { status: 500 });
  }
}

async function fetchAllAirtableRecords(): Promise<AirtableRecord[]> {
  const allRecords: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`);
    if (offset) url.searchParams.set('offset', offset);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
    });

    if (!response.ok) {
      throw new Error(`Airtable API: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as AirtableResponse;
    allRecords.push(...data.records);
    offset = data.offset;
  } while (offset);

  return allRecords;
}

function syncToDatabase(records: AirtableRecord[]): { synced: number; created: number; updated: number; errors: string[] } {
  const db = getDb();
  const errors: string[] = [];
  let created = 0;
  let updated = 0;

  for (const record of records) {
    try {
      const eventName = getField(record, 'Event Name');
      const date = getField(record, 'Event Date');
      const eventTimeRaw = getField(record, 'Event Time');
      const endTimeRaw = getField(record, 'End Time');
      const typeOfEvent = getField(record, 'Type of Event');
      const specialRequests = getField(record, 'Special Requests');
      const statusRaw = getField(record, 'Status');

      // Fallback: extract date from Event Name if Event Date is empty
      const resolvedDate = date || extractDateFromText(eventName);
      if (!resolvedDate) {
        errors.push(`Record ${record.id}: Kein Datum`);
        continue;
      }

      // Extract times from Event Time (often contains both start and end)
      const { timeStart: timeStartFromEvent, timeEnd: timeEndFromEvent, rest: timeOverflow } = extractTimesFromField(eventTimeRaw);
      // End Time field takes priority, then second time from Event Time
      const { timeStart: endTimeExplicit } = extractTimesFromField(endTimeRaw);
      const timeStart = timeStartFromEvent;
      const timeEnd = endTimeExplicit || timeEndFromEvent;

      // Combine menu notes from overflow text and special requests
      const menuNotesParts = [timeOverflow, specialRequests].filter(Boolean);
      const menuNotes = menuNotesParts.join('\n');

      // Extract PAX from Event Name or Event Time text
      const pax = extractPax(eventName, eventTimeRaw);

      const eventType = mapEventType(typeOfEvent);
      const status = mapStatus(statusRaw);

      // Check if already synced
      const existing = db.prepare('SELECT id FROM ak_events WHERE airtable_id = ?').get(record.id) as { id: number } | undefined;

      if (existing) {
        db.prepare(`
          UPDATE ak_events SET date = ?, event_type = ?, pax = ?, time_start = ?, time_end = ?,
            description = ?, menu_notes = ?, status = ?
          WHERE id = ?
        `).run(
          resolvedDate, eventType, pax,
          timeStart, timeEnd,
          eventName, menuNotes,
          status,
          existing.id
        );
        updated++;
      } else {
        db.prepare(`
          INSERT INTO ak_events (date, event_type, pax, time_start, time_end, description, menu_notes, status, airtable_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          resolvedDate, eventType, pax,
          timeStart, timeEnd,
          eventName, menuNotes,
          status,
          record.id
        );
        created++;
      }
    } catch (err) {
      errors.push(`Record ${record.id}: ${err instanceof Error ? err.message : 'Fehler'}`);
    }
  }

  return { synced: records.length, created, updated, errors };
}
