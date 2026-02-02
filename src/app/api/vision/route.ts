import { NextRequest, NextResponse } from 'next/server';

const GEMINI_PROMPT = `Du siehst ein Foto einer Felix Hotel-Pensionsliste (Gästezahlen-Tabelle).

Extrahiere die Tabellendaten. Jede Zeile hat ein Datum und "Ges." (Gesamt) mit Zahlen.
Die möglichen Spalten sind: Gesamt PAX, Frühstück, KP Vorm, Mittag, KP Nach, Abend E, Abend K.
NICHT jede Spalte muss vorhanden sein — manche Wochen haben z.B. kein "Abend E".

Lies die SPALTENÜBERSCHRIFTEN im Bild um zu erkennen welche Spalten vorhanden sind.
Verwende NUR die "Ges." Zeilen (Gesamtwerte pro Tag), NICHT die Einzelbuchungen darüber.

Gib NUR valides JSON zurück, KEIN anderer Text. Format:
{
  "hotel": "Hotelname aus dem Bild",
  "zeitraum": "DD.MM.YYYY - DD.MM.YYYY",
  "days": [
    {
      "date": "DD.MM.YY",
      "day": "Mo",
      "gesamt_pax": 48,
      "fruehstueck": 27,
      "kp_vorm": 0,
      "mittag": 0,
      "kp_nach": 0,
      "abend_e": 0,
      "abend_k": 0
    }
  ]
}

Regeln:
- Wenn eine Spalte im Bild nicht existiert, setze den Wert auf 0
- Wenn eine Zelle leer ist, setze den Wert auf 0
- Verwende IMMER das 2-stellige Jahresformat (z.B. "02.02.26")
- Tag-Abkürzungen: Mo, Di, Mi, Do, Fr, Sa, So`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GOOGLE_CLOUD_VISION_API_KEY nicht konfiguriert in .env.local' },
      { status: 500 }
    );
  }

  try {
    const { image } = await request.json();
    if (!image) {
      return NextResponse.json({ error: 'Kein Bild übergeben' }, { status: 400 });
    }

    // Strip data URL prefix and detect mime type
    let base64 = image;
    let mimeType = 'image/jpeg';
    if (image.includes(',')) {
      const prefix = image.split(',')[0];
      base64 = image.split(',')[1];
      if (prefix.includes('png')) mimeType = 'image/png';
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: GEMINI_PROMPT },
              { inline_data: { mime_type: mimeType, data: base64 } },
            ],
          }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', response.status, errText);
      return NextResponse.json(
        { error: `Gemini API Fehler (${response.status}). Ist die Generative Language API aktiviert?` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;

    if (!text) {
      console.error('Gemini: no text in response', JSON.stringify(data).slice(0, 500));
      return NextResponse.json({ error: 'Keine Antwort von Gemini' }, { status: 502 });
    }

    // Parse the JSON response from Gemini
    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Vision route error:', err);
    return NextResponse.json(
      { error: 'Fehler: ' + (err as Error).message },
      { status: 500 }
    );
  }
}
