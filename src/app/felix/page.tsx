'use client';

import { useState, useRef } from 'react';

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
  rawJson?: string;
}

export default function FelixPage() {
  const [image, setImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState('');
  const [result, setResult] = useState<OcrResult | null>(null);
  const [savedRows, setSavedRows] = useState<Set<string>>(new Set());
  const [location, setLocation] = useState('city');
  const fileRef = useRef<HTMLInputElement>(null);

  // Resize image for upload (max 2000px width)
  function resizeImage(dataUrl: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 2000;
        const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
        if (scale >= 1) { resolve(dataUrl); return; }
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = dataUrl;
    });
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const original = reader.result as string;
      const resized = await resizeImage(original);
      setImage(resized);
    };
    reader.readAsDataURL(file);
  }

  async function processOCR() {
    if (!image) return;
    setProcessing(true);
    setResult(null);
    setSavedRows(new Set());
    setOcrProgress('Sende an Gemini AI...');

    try {
      const res = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setResult({ hotel: '', zeitraum: '', days: [], rawJson: JSON.stringify(data, null, 2) });
        setOcrProgress('Fehler: ' + (data.error || 'Unbekannt'));
        setProcessing(false);
        return;
      }

      setOcrProgress('Verarbeite Ergebnis...');

      // Map Gemini JSON to our DayCount format
      const days: DayCount[] = (data.days || []).map((d: Record<string, unknown>) => {
        const abendE = Number(d.abend_e) || 0;
        const abendK = Number(d.abend_k) || 0;
        return {
          date: String(d.date || ''),
          day: String(d.day || ''),
          gesamtPax: Number(d.gesamt_pax) || 0,
          fruehstueck: Number(d.fruehstueck) || 0,
          kpVorm: Number(d.kp_vorm) || 0,
          mittag: Number(d.mittag) || 0,
          kpNach: Number(d.kp_nach) || 0,
          abendE,
          abendK,
          abendGesamt: abendE + abendK,
        };
      });

      const result: OcrResult = {
        hotel: data.hotel || '',
        zeitraum: data.zeitraum || '',
        days,
        rawJson: JSON.stringify(data, null, 2),
      };
      setResult(result);

      // Auto-detect location from hotel name
      if (result.hotel.toLowerCase().includes('süd') || result.hotel.toLowerCase().includes('sud')) {
        setLocation('sued');
      } else {
        setLocation('city');
      }
    } catch (err) {
      console.error('OCR failed:', err);
      setResult({ hotel: '', zeitraum: '', days: [], rawJson: 'Fehler: ' + (err as Error).message });
    }
    setProcessing(false);
  }

  async function saveDay(day: DayCount, meal: 'mittag' | 'abend', count: number) {
    // Convert date format DD.MM.YY to YYYY-MM-DD
    const parts = day.date.split('.');
    const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
    const isoDate = `${year}-${parts[1]}-${parts[0]}`;

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
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Felix Pensionsliste - Gästezahlen</h1>
      <p className="text-gray-600 text-sm">
        Foto der Felix-Pensionsliste hochladen. Gemini AI erkennt die Tabelle und liest alle Spalten korrekt aus.
      </p>

      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        {/* Location selector */}
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm">Standort:</span>
          <button onClick={() => setLocation('city')}
            className={`px-4 py-1.5 rounded font-semibold text-sm ${location === 'city' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
            Graz City
          </button>
          <button onClick={() => setLocation('sued')}
            className={`px-4 py-1.5 rounded font-semibold text-sm ${location === 'sued' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
            SÜD
          </button>
        </div>

        {/* Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input type="file" ref={fileRef} accept="image/*" onChange={handleFile} className="hidden" />
          <button onClick={() => fileRef.current?.click()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 text-lg">
            Pensionsliste-Foto hochladen
          </button>
          <p className="text-gray-400 text-sm mt-2">PNG, JPG — auch Kamerafotos</p>
        </div>

        {image && (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="Screenshot" className="max-h-64 rounded border" />
            <button onClick={processOCR} disabled={processing}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400">
              {processing ? ocrProgress || 'Verarbeite...' : 'Pensionsliste erkennen'}
            </button>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Detected info */}
            {result.hotel && <div className="text-sm"><span className="font-semibold">Hotel:</span> {result.hotel}</div>}
            {result.zeitraum && <div className="text-sm"><span className="font-semibold">Zeitraum:</span> {result.zeitraum}</div>}

            {/* Extracted table */}
            {result.days.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold">Erkannte Gästezahlen ({location === 'city' ? 'City' : 'SÜD'}):</h3>
                  <button onClick={saveAll}
                    className="bg-green-600 text-white px-4 py-1.5 rounded text-sm hover:bg-green-700 font-semibold">
                    Alle speichern
                  </button>
                </div>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-2 py-1 text-left">Datum</th>
                      <th className="border px-2 py-1 text-left">Tag</th>
                      <th className="border px-2 py-1 text-right">Gesamt</th>
                      <th className="border px-2 py-1 text-right">Frühstück</th>
                      <th className="border px-2 py-1 text-right text-gray-400">KP Vorm</th>
                      <th className="border px-2 py-1 text-right bg-yellow-50 font-bold">Mittag</th>
                      <th className="border px-2 py-1 text-right text-gray-400">KP Nach</th>
                      <th className="border px-2 py-1 text-right">Abend E</th>
                      <th className="border px-2 py-1 text-right">Abend K</th>
                      <th className="border px-2 py-1 text-right bg-yellow-50 font-bold">Abend Ges.</th>
                      <th className="border px-2 py-1 text-center">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.days.map((day, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="border px-2 py-1 font-medium">{day.date}</td>
                        <td className="border px-2 py-1">{day.day}</td>
                        <td className="border px-2 py-1 text-right text-gray-500">{day.gesamtPax}</td>
                        <td className="border px-2 py-1 text-right text-gray-500">{day.fruehstueck}</td>
                        <td className="border px-2 py-1 text-right text-gray-400">{day.kpVorm || '-'}</td>
                        <td className="border px-2 py-1 text-right bg-yellow-50">
                          <input type="number" value={day.mittag || ''} onChange={e => updateDay(i, 'mittag', parseInt(e.target.value) || 0)}
                            className="w-14 text-right border rounded px-1 py-0.5" />
                        </td>
                        <td className="border px-2 py-1 text-right text-gray-400">{day.kpNach || '-'}</td>
                        <td className="border px-2 py-1 text-right">
                          <input type="number" value={day.abendE || ''} onChange={e => updateDay(i, 'abendE', parseInt(e.target.value) || 0)}
                            className="w-14 text-right border rounded px-1 py-0.5" />
                        </td>
                        <td className="border px-2 py-1 text-right">
                          <input type="number" value={day.abendK || ''} onChange={e => updateDay(i, 'abendK', parseInt(e.target.value) || 0)}
                            className="w-14 text-right border rounded px-1 py-0.5" />
                        </td>
                        <td className="border px-2 py-1 text-right bg-yellow-50 font-semibold">{day.abendGesamt}</td>
                        <td className="border px-2 py-1 text-center space-x-1">
                          {day.mittag > 0 && (
                            <button onClick={() => saveDay(day, 'mittag', day.mittag)}
                              className={`px-2 py-0.5 rounded text-xs ${savedRows.has(`${day.date}-mittag`) ? 'bg-gray-300 text-gray-600' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                              {savedRows.has(`${day.date}-mittag`) ? 'M ok' : 'M'}
                            </button>
                          )}
                          {day.abendGesamt > 0 && (
                            <button onClick={() => saveDay(day, 'abend', day.abendGesamt)}
                              className={`px-2 py-0.5 rounded text-xs ${savedRows.has(`${day.date}-abend`) ? 'bg-gray-300 text-gray-600' : 'bg-orange-600 text-white hover:bg-orange-700'}`}>
                              {savedRows.has(`${day.date}-abend`) ? 'A ok' : 'A'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-gray-400 mt-1">M = Mittag speichern, A = Abend speichern (E+K zusammen). Zahlen sind editierbar.</p>
              </div>
            ) : (
              <div className="text-gray-500 text-sm">Keine Tageszeilen erkannt.</div>
            )}

            {/* Debug: raw Gemini JSON */}
            {result.rawJson && (
              <details className="text-sm">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700">Gemini-Rohdaten anzeigen</summary>
                <pre className="bg-gray-50 p-3 rounded whitespace-pre-wrap max-h-48 overflow-auto mt-2 text-xs">{result.rawJson}</pre>
              </details>
            )}
          </div>
        )}
      </div>

      {/* Manual entry */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-bold mb-3">Manuelle Eingabe</h3>
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
      <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border rounded px-2 py-1 text-sm" />
      <select value={location} onChange={e => setLocation(e.target.value)} className="border rounded px-2 py-1 text-sm">
        <option value="city">City</option>
        <option value="sued">SÜD</option>
      </select>
      <select value={meal} onChange={e => setMeal(e.target.value)} className="border rounded px-2 py-1 text-sm">
        <option value="mittag">Mittag</option>
        <option value="abend">Abend</option>
      </select>
      <input type="number" placeholder="Gäste" value={count || ''} onChange={e => setCount(parseInt(e.target.value) || 0)} className="border rounded px-2 py-1 text-sm w-20" />
      <button onClick={save} className="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700">Speichern</button>
      {saved && <span className="text-green-600 text-sm">Gespeichert!</span>}
    </div>
  );
}
