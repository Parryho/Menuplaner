'use client';

import { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';

interface DayCount {
  date: string;
  day: string;
  gesamtPax: number;
  fruehstueck: number;
  kpVorm: number;
  mittag: number;
  kpNach: number;
  abendE: number;
  abendK: number;
  abendGesamt: number;
}

interface OcrResult {
  hotel: string;
  zeitraum: string;
  days: DayCount[];
  rawText?: string;
}

const DAY_ABBREVS: Record<string, string> = {
  montag: 'Mo', dienstag: 'Di', mittwoch: 'Mi', donnerstag: 'Do',
  freitag: 'Fr', samstag: 'Sa', sonntag: 'So',
  mo: 'Mo', di: 'Di', mi: 'Mi', do: 'Do', fr: 'Fr', sa: 'Sa', so: 'So',
};

function parseFelixText(text: string): OcrResult {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const days: DayCount[] = [];

  // Find "Ges." lines which contain totals per day
  for (const line of lines) {
    // Match date pattern DD.MM.YY or DD.MM.YYYY
    const dateMatch = line.match(/(\d{1,2}\.\d{1,2}\.\d{2,4})/);
    if (!dateMatch) continue;

    // Extract all numbers from the line
    const numbers = line.match(/\d+/g)?.map(Number) || [];
    // Remove date digits from numbers
    const dateParts = dateMatch[1].split('.').map(Number);
    const cleanNumbers = numbers.filter(n => !dateParts.includes(n) || numbers.indexOf(n) > 3);

    // Try to find day name
    const lower = line.toLowerCase();
    let dayName = '';
    for (const [key, abbr] of Object.entries(DAY_ABBREVS)) {
      if (lower.includes(key)) { dayName = abbr; break; }
    }

    // Check if this looks like a "Ges." (total) line
    const isGesLine = lower.includes('ges') || lower.includes('gesamt') || lower.includes('total');

    // Only process lines with dates and at least some numbers
    if (cleanNumbers.length >= 2 || isGesLine) {
      // Parse numbers based on typical Felix column order:
      // Gesamt | Frühstück | KP Vorm | Mittag | KP Nach | Abend E | Abend K
      const nums = cleanNumbers.length >= 3 ? cleanNumbers : numbers.slice(3); // skip date parts
      const gesamt = nums[0] || 0;
      const frueh = nums[1] || 0;
      const kpV = nums[2] || 0;
      const mittag = nums[3] || 0;
      const kpN = nums[4] || 0;
      const abendE = nums[5] || 0;
      const abendK = nums[6] || 0;

      days.push({
        date: dateMatch[1],
        day: dayName,
        gesamtPax: gesamt,
        fruehstueck: frueh,
        kpVorm: kpV,
        mittag,
        kpNach: kpN,
        abendE,
        abendK,
        abendGesamt: abendE + abendK,
      });
    }
  }

  return { hotel: '', zeitraum: '', days, rawText: text };
}

export default function FelixPage() {
  const [image, setImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState('');
  const [result, setResult] = useState<OcrResult | null>(null);
  const [savedRows, setSavedRows] = useState<Set<string>>(new Set());
  const [location, setLocation] = useState('city');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function processOCR() {
    if (!image) return;
    setProcessing(true);
    setResult(null);
    setSavedRows(new Set());
    setOcrProgress('Starte Texterkennung...');

    try {
      const worker = await Tesseract.createWorker('deu', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(`Erkennung: ${Math.round((m.progress || 0) * 100)}%`);
          }
        },
      });

      const { data } = await worker.recognize(image);
      await worker.terminate();

      setOcrProgress('Verarbeite Text...');
      const parsed = parseFelixText(data.text);

      // Auto-detect location
      const lower = data.text.toLowerCase();
      if (lower.includes('süd') || lower.includes('sud')) {
        setLocation('sued');
      } else {
        setLocation('city');
      }

      setResult(parsed);
    } catch (err) {
      console.error('OCR failed:', err);
      setResult({ hotel: '', zeitraum: '', days: [], rawText: 'Fehler: ' + (err as Error).message });
    }
    setProcessing(false);
  }

  async function saveDay(day: DayCount, meal: 'mittag' | 'abend', count: number) {
    const parts = day.date.split('.');
    const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
    const isoDate = `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;

    await fetch('/api/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: isoDate, location, meal_type: meal, count }),
    });
    setSavedRows(prev => new Set(prev).add(`${day.date}-${meal}`));
  }

  async function saveAll() {
    if (!result) return;
    for (const day of result.days) {
      if (day.mittag > 0) await saveDay(day, 'mittag', day.mittag);
      if (day.abendGesamt > 0) await saveDay(day, 'abend', day.abendGesamt);
    }
  }

  function updateDay(idx: number, field: keyof DayCount, value: number) {
    if (!result) return;
    const updated = [...result.days];
    (updated[idx] as unknown as Record<string, unknown>)[field] = value;
    if (field === 'abendE' || field === 'abendK') {
      updated[idx].abendGesamt = updated[idx].abendE + updated[idx].abendK;
    }
    setResult({ ...result, days: updated });
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-primary-900">Felix Pensionsliste</h1>
        <p className="text-sm text-primary-500 mt-1">
          Foto der Felix-Pensionsliste hochladen. Texterkennung läuft lokal im Browser (kein API-Key nötig).
        </p>
      </div>

      <div className="bg-white rounded-card shadow-card border border-primary-100 p-5 space-y-4">
        {/* Location selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-primary-700">Standort:</span>
          <button onClick={() => setLocation('city')}
            className={`px-4 py-1.5 rounded-lg font-semibold text-sm transition-colors ${location === 'city' ? 'bg-primary-800 text-white' : 'bg-primary-100 text-primary-600 hover:bg-primary-200'}`}>
            City
          </button>
          <button onClick={() => setLocation('sued')}
            className={`px-4 py-1.5 rounded-lg font-semibold text-sm transition-colors ${location === 'sued' ? 'bg-primary-800 text-white' : 'bg-primary-100 text-primary-600 hover:bg-primary-200'}`}>
            SÜD
          </button>
        </div>

        {/* Upload */}
        <div className="border-2 border-dashed border-primary-200 rounded-lg p-8 text-center hover:border-accent-400 transition-colors">
          <input type="file" ref={fileRef} accept="image/*" onChange={handleFile} className="hidden" />
          <button onClick={() => fileRef.current?.click()}
            className="bg-accent-500 text-primary-900 px-6 py-3 rounded-lg hover:bg-accent-400 font-semibold transition-colors shadow-sm">
            Pensionsliste-Foto hochladen
          </button>
          <p className="text-primary-400 text-sm mt-2">PNG, JPG — auch Kamerafotos</p>
        </div>

        {image && (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="Screenshot" className="max-h-64 rounded-lg border border-primary-200" />
            <button onClick={processOCR} disabled={processing}
              className="bg-primary-800 text-white px-6 py-2.5 rounded-lg hover:bg-primary-700 disabled:bg-primary-300 font-semibold transition-colors">
              {processing ? ocrProgress || 'Verarbeite...' : 'Pensionsliste erkennen'}
            </button>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {result.days.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-primary-900">Erkannte Gästezahlen ({location === 'city' ? 'City' : 'SÜD'}):</h3>
                  <button onClick={saveAll}
                    className="bg-accent-500 text-primary-900 px-4 py-1.5 rounded-lg text-sm hover:bg-accent-400 font-semibold transition-colors">
                    Alle speichern
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-primary-50">
                        <th className="border border-primary-200 px-2 py-1.5 text-left font-semibold text-primary-700">Datum</th>
                        <th className="border border-primary-200 px-2 py-1.5 text-left font-semibold text-primary-700">Tag</th>
                        <th className="border border-primary-200 px-2 py-1.5 text-right font-semibold text-primary-500">Gesamt</th>
                        <th className="border border-primary-200 px-2 py-1.5 text-right font-semibold text-primary-500">Frühstück</th>
                        <th className="border border-primary-200 px-2 py-1.5 text-right font-semibold text-primary-700 bg-accent-50">Mittag</th>
                        <th className="border border-primary-200 px-2 py-1.5 text-right font-semibold text-primary-500">Abend E</th>
                        <th className="border border-primary-200 px-2 py-1.5 text-right font-semibold text-primary-500">Abend K</th>
                        <th className="border border-primary-200 px-2 py-1.5 text-right font-semibold text-primary-700 bg-accent-50">Abend Ges.</th>
                        <th className="border border-primary-200 px-2 py-1.5 text-center font-semibold text-primary-700">Aktionen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.days.map((day, i) => (
                        <tr key={i} className="hover:bg-primary-50/50">
                          <td className="border border-primary-100 px-2 py-1 font-medium text-primary-900">{day.date}</td>
                          <td className="border border-primary-100 px-2 py-1 text-primary-600">{day.day}</td>
                          <td className="border border-primary-100 px-2 py-1 text-right text-primary-400">{day.gesamtPax}</td>
                          <td className="border border-primary-100 px-2 py-1 text-right text-primary-400">{day.fruehstueck}</td>
                          <td className="border border-primary-100 px-2 py-1 text-right bg-accent-50/50">
                            <input type="number" value={day.mittag || ''} onChange={e => updateDay(i, 'mittag', parseInt(e.target.value) || 0)}
                              className="w-14 text-right border border-primary-200 rounded px-1 py-0.5 focus:border-accent-500 outline-none" />
                          </td>
                          <td className="border border-primary-100 px-2 py-1 text-right">
                            <input type="number" value={day.abendE || ''} onChange={e => updateDay(i, 'abendE', parseInt(e.target.value) || 0)}
                              className="w-14 text-right border border-primary-200 rounded px-1 py-0.5 focus:border-accent-500 outline-none" />
                          </td>
                          <td className="border border-primary-100 px-2 py-1 text-right">
                            <input type="number" value={day.abendK || ''} onChange={e => updateDay(i, 'abendK', parseInt(e.target.value) || 0)}
                              className="w-14 text-right border border-primary-200 rounded px-1 py-0.5 focus:border-accent-500 outline-none" />
                          </td>
                          <td className="border border-primary-100 px-2 py-1 text-right bg-accent-50/50 font-semibold text-primary-900">{day.abendGesamt}</td>
                          <td className="border border-primary-100 px-2 py-1 text-center space-x-1">
                            {day.mittag > 0 && (
                              <button onClick={() => saveDay(day, 'mittag', day.mittag)}
                                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${savedRows.has(`${day.date}-mittag`) ? 'bg-primary-200 text-primary-500' : 'bg-primary-800 text-white hover:bg-primary-700'}`}>
                                {savedRows.has(`${day.date}-mittag`) ? 'M ok' : 'M'}
                              </button>
                            )}
                            {day.abendGesamt > 0 && (
                              <button onClick={() => saveDay(day, 'abend', day.abendGesamt)}
                                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${savedRows.has(`${day.date}-abend`) ? 'bg-primary-200 text-primary-500' : 'bg-accent-500 text-primary-900 hover:bg-accent-400'}`}>
                                {savedRows.has(`${day.date}-abend`) ? 'A ok' : 'A'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-primary-400 mt-2">M = Mittag speichern, A = Abend speichern (E+K zusammen). Zahlen sind editierbar.</p>
              </div>
            ) : (
              <div className="text-primary-400 text-sm py-4 text-center">Keine Tageszeilen erkannt. Versuche ein schärferes Foto.</div>
            )}

            {result.rawText && (
              <details className="text-sm">
                <summary className="cursor-pointer text-primary-400 hover:text-primary-600">Erkannter Rohtext anzeigen</summary>
                <pre className="bg-primary-50 p-3 rounded-lg whitespace-pre-wrap max-h-48 overflow-auto mt-2 text-xs text-primary-600">{result.rawText}</pre>
              </details>
            )}
          </div>
        )}
      </div>

      {/* Manual entry */}
      <div className="bg-white rounded-card shadow-card border border-primary-100 p-5">
        <h3 className="font-bold text-primary-900 mb-3">Manuelle Eingabe</h3>
        <ManualGuestCount />
      </div>
    </div>
  );
}

function ManualGuestCount() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('city');
  const [meal, setMeal] = useState('mittag');
  const [count, setCount] = useState(0);
  const [saved, setSaved] = useState(false);

  async function save() {
    await fetch('/api/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, location, meal_type: meal, count }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <input type="date" value={date} onChange={e => setDate(e.target.value)}
        className="border border-primary-200 rounded-lg px-3 py-2 text-sm focus:border-accent-500 outline-none" />
      <select value={location} onChange={e => setLocation(e.target.value)}
        className="border border-primary-200 rounded-lg px-3 py-2 text-sm focus:border-accent-500 outline-none">
        <option value="city">City</option>
        <option value="sued">SÜD</option>
      </select>
      <select value={meal} onChange={e => setMeal(e.target.value)}
        className="border border-primary-200 rounded-lg px-3 py-2 text-sm focus:border-accent-500 outline-none">
        <option value="mittag">Mittag</option>
        <option value="abend">Abend</option>
      </select>
      <input type="number" placeholder="Gäste" value={count || ''} onChange={e => setCount(parseInt(e.target.value) || 0)}
        className="border border-primary-200 rounded-lg px-3 py-2 text-sm w-20 focus:border-accent-500 outline-none" />
      <button onClick={save}
        className="bg-primary-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700 font-semibold transition-colors">
        Speichern
      </button>
      {saved && <span className="text-accent-600 text-sm font-medium">Gespeichert!</span>}
    </div>
  );
}
