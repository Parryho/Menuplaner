'use client';

import { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { preprocessImage } from '@/lib/image-preprocess';
import { api } from '@/lib/api-client';
import {
  parseFelixText,
  confidenceLevel,
  CONFIDENCE_DOT,
  type DayCount,
  type FelixResult,
} from '@/lib/felix-parser';

type ProcessingStep = 'idle' | 'optimizing' | 'ocr' | 'ocr-retry' | 'parsing' | 'pdf' | 'done';

const STEP_LABELS: Record<ProcessingStep, string> = {
  idle: '',
  optimizing: 'Bild wird optimiert...',
  ocr: 'Texterkennung...',
  'ocr-retry': 'Zweiter Durchlauf (anderer Modus)...',
  parsing: 'Verarbeite Text...',
  pdf: 'PDF wird ausgelesen...',
  done: 'Fertig',
};

export default function FelixPage() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<ProcessingStep>('idle');
  const [ocrPercent, setOcrPercent] = useState(0);
  const [result, setResult] = useState<FelixResult | null>(null);
  const [savedRows, setSavedRows] = useState<Set<string>>(new Set());
  const [location, setLocation] = useState('city');
  const [isPdf, setIsPdf] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setResult(null);
    setSavedRows(new Set());
    setProcessedImage(null);

    if (file.type === 'application/pdf') {
      setIsPdf(true);
      setOriginalImage(null);
      await processPdf(file);
      return;
    }

    setIsPdf(false);
    const reader = new FileReader();
    reader.onload = () => setOriginalImage(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function processPdf(file: File) {
    setProcessing(true);
    setStep('pdf');

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/pdf-extract', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'PDF-Extraktion fehlgeschlagen');
      }

      setStep('parsing');
      const parsed = parseFelixText(data.text);
      if (parsed.hotel) setLocation(parsed.hotel);
      setResult(parsed);
      setStep('done');
    } catch (err) {
      console.error('PDF failed:', err);
      setResult({ hotel: '', zeitraum: '', days: [], rawText: 'Fehler: ' + (err as Error).message });
    }
    setProcessing(false);
  }

  async function processOCR() {
    if (!originalImage) return;
    setProcessing(true);
    setResult(null);
    setSavedRows(new Set());

    try {
      // Step 1: Preprocess image
      setStep('optimizing');
      const optimized = await preprocessImage(originalImage);
      setProcessedImage(optimized);

      // Step 2: OCR with improved config
      setStep('ocr');
      setOcrPercent(0);
      const text = await runTesseract(optimized, 6);

      // Step 3: Parse
      setStep('parsing');
      let parsed = parseFelixText(text);

      // Step 4: If poor results, retry with different PSM
      if (parsed.days.length < 3) {
        setStep('ocr-retry');
        setOcrPercent(0);
        const text2 = await runTesseract(optimized, 4);
        const parsed2 = parseFelixText(text2);
        if (parsed2.days.length > parsed.days.length) {
          parsed = parsed2;
        }
      }

      if (parsed.hotel) setLocation(parsed.hotel);
      setResult(parsed);
      setStep('done');
    } catch (err) {
      console.error('OCR failed:', err);
      setResult({ hotel: '', zeitraum: '', days: [], rawText: 'Fehler: ' + (err as Error).message });
    }
    setProcessing(false);
  }

  async function runTesseract(imageData: string, psm: number): Promise<string> {
    const worker = await Tesseract.createWorker('deu', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          setOcrPercent(Math.round((m.progress || 0) * 100));
        }
      },
    });

    await worker.setParameters({
      tessedit_pageseg_mode: String(psm) as Tesseract.PSM,
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÄÖÜäöüß.,/-| ',
      preserve_interword_spaces: '1',
    });

    const { data } = await worker.recognize(imageData);
    await worker.terminate();
    return data.text;
  }

  async function saveDay(day: DayCount, meal: 'mittag' | 'abend', count: number) {
    const parts = day.date.split('.');
    const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
    const isoDate = `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;

    try {
      await api.post('/api/ocr', { date: isoDate, location, meal_type: meal, count });
      setSavedRows(prev => new Set(prev).add(`${day.date}-${meal}`));
    } catch (err) {
      console.error('Error saving day:', err);
    }
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

  const stepLabel = step === 'ocr' || step === 'ocr-retry'
    ? `${STEP_LABELS[step]} ${ocrPercent}%`
    : STEP_LABELS[step];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-primary-900">Felix Pensionsliste</h1>
        <p className="text-sm text-primary-500 mt-1">
          Foto oder PDF der Felix-Pensionsliste hochladen. Texterkennung läuft lokal im Browser (kein API-Key nötig).
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
          <input type="file" ref={fileRef} accept="image/*,.pdf" onChange={handleFile} className="hidden" />
          <button onClick={() => fileRef.current?.click()}
            className="bg-accent-500 text-primary-900 px-6 py-3 rounded-lg hover:bg-accent-400 font-semibold transition-colors shadow-sm">
            Pensionsliste hochladen
          </button>
          <p className="text-primary-400 text-sm mt-2">PNG, JPG, PDF — auch Kamerafotos</p>
        </div>

        {/* Progress indicator */}
        {processing && (
          <div className="flex items-center gap-3 px-3 py-2 bg-primary-50 rounded-lg">
            <div className="h-4 w-4 border-2 border-primary-300 border-t-primary-700 rounded-full animate-spin" />
            <span className="text-sm font-medium text-primary-700">{stepLabel}</span>
            {(step === 'ocr' || step === 'ocr-retry') && (
              <div className="flex-1 max-w-xs bg-primary-200 rounded-full h-2">
                <div className="bg-primary-700 h-2 rounded-full transition-all" style={{ width: `${ocrPercent}%` }} />
              </div>
            )}
          </div>
        )}

        {/* Image preview: Original + Processed side by side */}
        {originalImage && !isPdf && (
          <div className="space-y-3">
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <p className="text-xs text-primary-400 mb-1 font-medium">Original</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={originalImage} alt="Original" className="max-h-56 rounded-lg border border-primary-200" />
              </div>
              {processedImage && (
                <div className="flex-1 min-w-[200px]">
                  <p className="text-xs text-primary-400 mb-1 font-medium">Optimiert (Tesseract-Input)</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={processedImage} alt="Processed" className="max-h-56 rounded-lg border border-primary-200" />
                </div>
              )}
            </div>
            {!processing && (
              <button onClick={processOCR}
                className="bg-primary-800 text-white px-6 py-2.5 rounded-lg hover:bg-primary-700 font-semibold transition-colors">
                Pensionsliste erkennen
              </button>
            )}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {result.days.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-primary-900">
                    Erkannte Gästezahlen ({location === 'city' ? 'City' : 'SÜD'})
                    {isPdf && <span className="ml-2 text-xs font-normal text-primary-400">(aus PDF extrahiert)</span>}
                  </h3>
                  <button onClick={saveAll}
                    className="bg-accent-500 text-primary-900 px-4 py-1.5 rounded-lg text-sm hover:bg-accent-400 font-semibold transition-colors">
                    Alle speichern
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-primary-50">
                        <th className="border border-primary-200 px-2 py-1.5 text-center font-semibold text-primary-500 w-8" title="Konfidenz"></th>
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
                      {result.days.map((day, i) => {
                        const level = confidenceLevel(day.confidence);
                        return (
                          <tr key={i} className="hover:bg-primary-50/50">
                            <td className="border border-primary-100 px-2 py-1 text-center">
                              <span
                                className={`inline-block w-2.5 h-2.5 rounded-full ${CONFIDENCE_DOT[level]}`}
                                title={`Konfidenz: ${Math.round(day.confidence * 100)}%`}
                              />
                            </td>
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-primary-400">
                  <span>M = Mittag speichern, A = Abend speichern (E+K zusammen). Zahlen sind editierbar.</span>
                  <span className="flex items-center gap-1.5 ml-auto">
                    <span className={`inline-block w-2 h-2 rounded-full ${CONFIDENCE_DOT.high}`} /> Sicher
                    <span className={`inline-block w-2 h-2 rounded-full ${CONFIDENCE_DOT.medium} ml-2`} /> Prüfen
                    <span className={`inline-block w-2 h-2 rounded-full ${CONFIDENCE_DOT.low} ml-2`} /> Unsicher
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-primary-400 text-sm py-4 text-center">Keine Tageszeilen erkannt. Versuche ein schärferes Foto oder ein PDF.</div>
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
