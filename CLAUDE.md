# Menuplan-Generator - Projektregeln

## Projektbeschreibung
Web-App fuer Menuplanung in 2 Hotels + 1 Cateringlocation:
- **JUFA City** = Hauptstandort der Kueche
- **JUFA SUED** = Auslieferung
- **Arbeiterkammer (AK)** = Catering, groessere Events (Brunch, Baelle, Buffets, Bankett)

## Tech-Stack
- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- SQLite via better-sqlite3 (lokal)
- Excel-Export: exceljs
- OCR: Tesseract.js (Felix Pensionsliste Screenshots)
- Projektordner: C:\Dev\menuplan-generator\

## Kochregeln (Fachlich)

### Mahlzeiten-Struktur (Hotels City + SUED)
Mittag UND Abend jeweils:
1. 1x Suppe
2. 1x Fleischgericht + Beilage/n
3. 1x Vegetarisches Gericht + Beilage/n
4. 1x Dessert (Kuchen, Creme usw. abwechselnd)

### AK Catering
- Komplett andere Struktur je nach Event-Typ
- Event-Typen: Brunch, Baelle, Buffets, Bankett usw.
- Eigener Menuplan pro Event, nicht im Wochenraster

### HACCP Temperaturfelder
- JEDES Gericht bekommt Temperaturfelder (Suppe, Haupt, Beilage, Dessert)
- Format: __/__ (Kerntemperatur/Ausgabetemperatur)
- Beispiel: Schnitzel mit Pommes = 2 Temp-Felder (eins fuer Schnitzel, eins fuer Pommes)

### Allergene (Oesterreich, EU 1169/2011)
- A=Gluten, B=Krebstiere, C=Eier, D=Fisch, E=Erdnuesse, F=Soja
- G=Milch/Laktose, H=Schalenfruechte, L=Sellerie, M=Senf
- N=Sesam, O=Sulfite, P=Lupinen, R=Weichtiere
- MUESSEN 100% korrekt sein - KEINE Halluzinationen!
- Im Zweifel lieber zu viele Allergene als zu wenige

### 6-Wochen-Rotation
- 6 Wochen Vorlagen, dann Wiederholung
- Abwechslungsreich: Hauptgerichte (Fleisch, Vegetarisch, Fisch) NICHT wiederholen ueber 6 Wochen
- Suppen duerfen sich max 2x in 6 Wochen wiederholen
- Desserts duerfen sich max 2-3x in 6 Wochen wiederholen
- Beilagen duerfen sich wiederholen (Reis, Pommes, Erdaepfelpueree etc.)
- Innerhalb einer Woche: KEIN Gericht doppelt (ausser Beilagen)
- Saisonal anpassbar (Sommer/Winter)
- Mindestens: 30 Fleisch, 20 Vegetarisch, 15 Suppen, 15 Desserts, 10 Fisch

## Drucklayout (A4 Hochformat)
- 4 Bereiche nebeneinander: City Mittag | City Abend | SUED Mittag | SUED Abend
- Pro Tag: 8 Zeilen (Suppe, Haupt1, Beilage, Beilage, Haupt2, Beilage, Beilage, Dessert)
- 7 Tage = 56 Zeilen + Header
- MUSS im Kuechenstress schnell lesbar sein - gross, klar, uebersichtlich
- Wochentag + Datum gut sichtbar

## Felix OCR (Gaestezahlen)
- Felix = Bookingtool im Hotel
- Pensionsliste zeigt: Gesamt PAX | Fruehstueck | KP Vorm | Mittag | KP Nach | Abend E | Abend K
- KP Vorm = Kaffeepause Vormittag, KP Nach = Kaffeepause Nachmittag
- Abend E = Erwachsene, Abend K = Kinder
- Abend E + K zusammenrechnen fuer Menuplanung
- Screenshot hochladen -> OCR -> Zahlen erkennen -> Menuplan erstellen
- Spaltenposition im OCR-Text beachten fuer korrekte Zuordnung
- Bei 6 Zahlen: leeres Feld (AbendE) erkennen, 6. Zahl = AbendK

## Code-Regeln
- Server-only Module (better-sqlite3) NIEMALS in Client-Komponenten importieren
- Client-Konstanten in src/lib/constants.ts (nicht rotation.ts)
- Alle useSearchParams()-Seiten brauchen Suspense-Wrapper
- Deutsche UI-Texte, Code-Kommentare auf Englisch ok

## Design-Regeln
- KEIN generisches/template-look - soll professionell wirken wie von einem Designer
- Klare Typografie, gute Abstände, konsistente Farbpalette
- Kein unnötiges visuelles Rauschen - clean, funktional, elegant
- Küchentauglich: hoher Kontrast, gut lesbar auf Papier und Bildschirm

## Token-Effizienz (WICHTIG - Kosten sparen!)
- NIEMALS ganzen Codebase durchsuchen - gezielte Datei-Reads
- Haiku-Modell fuer einfache Tasks (CRUD, CSS, Boilerplate)
- Sonnet fuer Logik (DB, OCR, Rotation)
- Opus nur fuer komplexe Architektur
- Write statt Edit fuer komplett neue Dateien
- Parallelisierung: unabhaengige Dateien parallel erstellen
- Background-Tasks fuer Build/Install
- CLAUDE.md immer zuerst lesen - hier steht alles was man wissen muss

## Dateistruktur (kein Suchen noetig)
```
menuplan-generator/
├── docs/                       # Recherche-Dokumente
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Basis-Layout + Nav
│   │   ├── page.tsx            # Dashboard
│   │   ├── wochenplan/page.tsx # Hauptansicht
│   │   ├── rotation/page.tsx   # 6-Wochen Editor
│   │   ├── gerichte/page.tsx   # Gerichte CRUD
│   │   ├── felix/page.tsx      # OCR Upload
│   │   ├── events/page.tsx     # AK Events
│   │   ├── export/page.tsx     # Export
│   │   ├── druck/page.tsx      # Druckansicht
│   │   └── api/
│   │       ├── dishes/route.ts
│   │       ├── plans/route.ts  # ACHTUNG: SQL Injection fixen!
│   │       ├── export/route.ts
│   │       ├── ocr/route.ts
│   │       ├── events/route.ts
│   │       └── init/route.ts
│   ├── lib/
│   │   ├── db.ts               # SQLite Connection
│   │   ├── schema.ts           # DB Schema
│   │   ├── seed.ts             # Seed-Daten (Gerichte + Rotation)
│   │   ├── allergens.ts        # AT Allergene
│   │   ├── rotation.ts         # Rotationslogik (server-only!)
│   │   └── constants.ts        # Client-safe Konstanten
│   └── components/
│       ├── WeekGrid.tsx
│       ├── MealCard.tsx
│       ├── AllergenBadge.tsx
│       ├── TempInput.tsx
│       └── Navigation.tsx
├── data/
│   └── menuplan.db
├── package.json
└── tailwind.config.ts
```

## Bekannte Bugs / Offene Tasks
1. ~~SQL Injection in /api/plans PUT Route~~ ERLEDIGT - Whitelist fuer Slot-Namen
2. ~~Felix OCR: Spaltenposition-Erkennung~~ ERLEDIGT - 2-Pass mit 7-Zahlen-Referenzzeile
3. ~~AK als 3. Standort~~ ERLEDIGT - DB-Schema erweitert, Events-UI komplett, Airtable-Sync
4. ~~Temperatur-Logging~~ ERLEDIGT - /api/temperatures mit Upsert, debounced Auto-Save in MealCard
5. Automatische Menuplan-Erstellung aus Felix-Gaestezahlen fehlt
6. ~~Gerichte + Allergene~~ ERLEDIGT - 128 Gerichte in DB geseeded
7. ~~6-Wochen-Rotation~~ ERLEDIGT - 336 Eintraege, City+SUED differenziert
8. ~~Design aufwerten~~ ERLEDIGT - Sidebar-Nav, Slate/Amber, alle Seiten professionell

## Neue APIs
- /api/temperatures - HACCP-Temperaturen speichern/laden (GET/POST)
- /api/airtable - Airtable-Sync fuer AK Events (GET status/sync, POST test connection)
- .env.local: AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME

## AK Events System
- 7 Event-Typen: brunch, ball, buffet, bankett, empfang, seminar, sonstiges
- 4 Status: geplant, bestaetigt, abgesagt, abgeschlossen
- Erweiterte Felder: time_start, time_end, contact_person, room
- Airtable-Sync: NUR LESEN, niemals nach Airtable schreiben! Read-only Integration.
- Tabelle: "Catering Events" mit Feldern: Event Name, Event Date, Event Time, End Time, Type of Event, Special Requests, Status, Location, Client, Staff
- Menu-Items pro Event (ak_event_menu_items Tabelle)
- Professionelle Card-basierte UI mit Typ-Icons, Status-Farben, Datum-Block

## Verbesserungs-Roadmap
### Phase 1 (naechste Schritte)
- ~~HACCP-Temperaturen speichern~~ ERLEDIGT
- ~~City vs SUED differenzierte Menues~~ ERLEDIGT
- Drag-and-Drop Gerichte tauschen
- HACCP-Temperaturen im Excel-Export
### Phase 2
- Mengenberechnung aus Gaestezahlen (Felix -> Produktionsliste)
- Wareneinsatz-Kalkulation pro Gericht
- Einkaufsliste aus Wochenplan generieren
### Phase 3
- ~~AK-Catering Event-Modul~~ ERLEDIGT
- Multi-Standort-Dashboard
- Saisonaler Sommer/Winter-Wechsel
### Phase 4+
- Menu Engineering Matrix (Stars/Dogs)
- Rezept-Datenbank mit Zubereitungsanweisungen
- KI-gestuetzte Menuplan-Generierung
- AI Features (siehe AI_FEATURES_RECHERCHE.md)

## Recherche-Ergebnisse (gesichert)
### 128 Gerichte mit korrekten Allergenen
- 32 Fleisch, 12 Fisch, 22 Vegetarisch, 18 Suppen, 16 Desserts, 28 Beilagen
- Allergene nach EU 1169/2011 geprueft gegen oesterreichische Quellen
- Wichtige Korrekturen: Sellerie(L) bei Suppen/Fond, Sulfite(O) bei Sauerkraut/Wein, Senf(M) bei Faschiertem
### HACCP Grenzwerte
- Kalte Speisen: max +7°C
- Kerntemperatur Erhitzen: mind +70°C
- Warmhaltung: min +65°C
- Abkuehlung: +50 auf +10°C innerhalb 2h

## Aktueller Status
- Dev-Server laeuft auf localhost:3004
- 128 Gerichte in DB (alle Kategorien korrekt)
- 6-Wochen-Rotation mit 336 Eintraegen (City+SUED differenziert)
- Woche 1+6: nur Mo-Fr, Woche 2-5: So-Fr - KEIN Samstag!
- Professionelles Design: Sidebar-Nav, Slate/Amber Farbpalette
- Felix OCR: 2-Pass Spaltenposition funktioniert
- HACCP-Temperaturen speichern + laden funktioniert
- AK Events mit Airtable-Integration (Konfiguration in .env.local)
- VS Code Debugger: .vscode/launch.json mit 3 Konfigurationen
