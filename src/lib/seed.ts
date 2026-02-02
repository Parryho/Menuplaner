import { getDb } from './db';
import { initializeDatabase } from './schema';

interface DishSeed {
  name: string;
  category: 'suppe' | 'fleisch' | 'fisch' | 'vegetarisch' | 'dessert' | 'beilage';
  allergens: string;
}

// =====================================================================
// GERICHTELISTE -- 6-Wochen-Rotation Hotelküche Österreich (168 Gerichte)
// =====================================================================
// Allergen-Codes gemäß EU-VO 1169/2011 / Codex-Empfehlung Österreich:
//   A = Glutenhaltiges Getreide   B = Krebstiere
//   C = Eier                       D = Fisch
//   E = Erdnüsse                  F = Soja
//   G = Milch/Laktose              H = Schalenfrüchte
//   L = Sellerie                   M = Senf
//   N = Sesam                      O = Sulfite
//   P = Lupinen                    R = Weichtiere
//
// HINWEIS: Allergene wurden auf Basis von Standard-Rezepturen recherchiert
// (guteküche.at, ichkoche.at, WKO Allergenkennzeichnung).
// Im Zweifel eher mehr Allergene angegeben (Vorsichtsprinzip).
// Jeder Betrieb muss seine tatsächlichen Rezepturen/Zutaten prüfen!
// =====================================================================

const DISHES: DishSeed[] = [
  // ==========================================================================
  // SUPPEN (23 Stück)
  // ==========================================================================
  { name: 'Rindsuppe mit Frittaten', category: 'suppe', allergens: 'ACGL' },
  { name: 'Frittatensuppe', category: 'suppe', allergens: 'ACGL' },
  { name: 'Grießnockerlsuppe', category: 'suppe', allergens: 'ACGL' },
  { name: 'Leberknödelsuppe', category: 'suppe', allergens: 'ACGL' },
  { name: 'Backerbsensuppe', category: 'suppe', allergens: 'ACGL' },
  { name: 'Nudelsuppe', category: 'suppe', allergens: 'ACGL' },
  { name: 'Kürbiscremesuppe', category: 'suppe', allergens: 'AGL' },
  { name: 'Kartoffelcremesuppe', category: 'suppe', allergens: 'AGL' },
  { name: 'Tomatencremesuppe', category: 'suppe', allergens: 'AGL' },
  { name: 'Spargelcremesuppe', category: 'suppe', allergens: 'AGL' },
  { name: 'Karottencremesuppe', category: 'suppe', allergens: 'GL' },
  { name: 'Gemüsesuppe', category: 'suppe', allergens: 'AL' },
  { name: 'Minestrone', category: 'suppe', allergens: 'AL' },
  { name: 'Brokkolicremesuppe', category: 'suppe', allergens: 'AGL' },
  { name: 'Erbsencremesuppe', category: 'suppe', allergens: 'AGL' },
  { name: 'Knoblauchcremesuppe', category: 'suppe', allergens: 'AGL' },
  { name: 'Zwiebelsuppe', category: 'suppe', allergens: 'AGL' },
  { name: 'Klare Gemüsebrühe mit Einlage', category: 'suppe', allergens: 'ACL' },
  { name: 'Gulaschsuppe', category: 'suppe', allergens: 'ALO' },
  { name: 'Schwammerlcremesuppe', category: 'suppe', allergens: 'AGL' },
  { name: 'Selleriecremesuppe', category: 'suppe', allergens: 'AGL' },
  { name: 'Lauchcremesuppe', category: 'suppe', allergens: 'AGL' },
  { name: 'Kaspressknödelsuppe', category: 'suppe', allergens: 'ACGL' },

  // ==========================================================================
  // FLEISCHGERICHTE (42 Stück)
  // ==========================================================================
  { name: 'Wiener Schnitzel', category: 'fleisch', allergens: 'ACG' },
  { name: 'Schnitzel vom Schwein', category: 'fleisch', allergens: 'ACG' },
  { name: 'Pariser Schnitzel', category: 'fleisch', allergens: 'ACG' },
  { name: 'Naturschnitzel vom Schwein', category: 'fleisch', allergens: 'AGLO' },
  { name: 'Putenschnitzel', category: 'fleisch', allergens: 'ACG' },
  { name: 'Schweinsbraten', category: 'fleisch', allergens: 'AGL' },
  { name: 'Rinderbraten', category: 'fleisch', allergens: 'AGLO' },
  { name: 'Rindsgulasch', category: 'fleisch', allergens: 'ALO' },
  { name: 'Rindsgeschnetzeltes', category: 'fleisch', allergens: 'AGLO' },
  { name: 'Tafelspitz', category: 'fleisch', allergens: 'GL' },
  { name: 'Zwiebelrostbraten', category: 'fleisch', allergens: 'ACGLO' },
  { name: 'Schweinefilet', category: 'fleisch', allergens: 'AGLO' },
  { name: 'Hühnerfilet', category: 'fleisch', allergens: 'AGL' },
  { name: 'Hühnerstreifen', category: 'fleisch', allergens: 'AGL' },
  { name: 'Hühnergeschnetzeltes', category: 'fleisch', allergens: 'AGLO' },
  { name: 'Puten-Rahmgeschnetzeltes', category: 'fleisch', allergens: 'AGLO' },
  { name: 'Gemüse-Hühnercurry', category: 'fleisch', allergens: 'AGL' },
  { name: 'Korma-Hühnerkeule', category: 'fleisch', allergens: 'AGH' },
  { name: 'Spaghetti Bolognese', category: 'fleisch', allergens: 'ACGL' },
  { name: 'Cevapcici', category: 'fleisch', allergens: 'AMO' },
  { name: 'Faschierte Laibchen', category: 'fleisch', allergens: 'ACGM' },
  { name: 'Paprikahendl', category: 'fleisch', allergens: 'AGLO' },
  { name: 'Geselchtes mit Sauerkraut', category: 'fleisch', allergens: 'MO' },
  { name: 'Schweinshaxe', category: 'fleisch', allergens: 'AGL' },
  { name: 'Putenrollbraten', category: 'fleisch', allergens: 'AGLO' },
  { name: 'Hühnerkeulen überbacken', category: 'fleisch', allergens: 'ACG' },
  { name: 'Geschnetzeltes Zürcher Art', category: 'fleisch', allergens: 'AGLO' },
  { name: 'Fleischknödel', category: 'fleisch', allergens: 'ACGL' },
  { name: 'Steirisches Wurzelfleisch', category: 'fleisch', allergens: 'AMLO' },
  { name: 'Hühner-Gemüse-Pfanne', category: 'fleisch', allergens: 'AFL' },
  { name: 'Puten-Curry', category: 'fleisch', allergens: 'AGL' },
  { name: 'Rindsroulade', category: 'fleisch', allergens: 'ACGMLO' },
  { name: 'Backhendl', category: 'fleisch', allergens: 'ACG' },
  { name: 'Cordon Bleu', category: 'fleisch', allergens: 'ACG' },
  { name: 'Jägerschnitzel', category: 'fleisch', allergens: 'AGLO' },
  { name: 'Rahmschnitzel', category: 'fleisch', allergens: 'AGLO' },
  { name: 'Kümmelbraten', category: 'fleisch', allergens: 'AGL' },
  { name: 'Reisfleisch', category: 'fleisch', allergens: 'AL' },
  { name: 'Leberkäse', category: 'fleisch', allergens: 'AGMO' },
  { name: 'Beuschel', category: 'fleisch', allergens: 'AGLO' },
  { name: 'Kalbsgulasch', category: 'fleisch', allergens: 'AGLO' },
  { name: 'Gebackene Leber', category: 'fleisch', allergens: 'ACG' },

  // ==========================================================================
  // FISCHGERICHTE (14 Stück)
  // ==========================================================================
  { name: 'Lachsfilet', category: 'fisch', allergens: 'DG' },
  { name: 'Seehechtfilet', category: 'fisch', allergens: 'DG' },
  { name: 'Seelachsfilet gebacken', category: 'fisch', allergens: 'ACDG' },
  { name: 'Fischstäbchen', category: 'fisch', allergens: 'ACDG' },
  { name: 'Seehecht gebraten', category: 'fisch', allergens: 'ADG' },
  { name: 'Forelle Müllerin', category: 'fisch', allergens: 'ACDG' },
  { name: 'Zanderfilet auf Gemüsebett', category: 'fisch', allergens: 'ADGL' },
  { name: 'Lachsforelle mit Kräuterkruste', category: 'fisch', allergens: 'ACDG' },
  { name: 'Pangasiusfilet gedünstet', category: 'fisch', allergens: 'DGL' },
  { name: 'Fischfilet im Backteig', category: 'fisch', allergens: 'ACDG' },
  { name: 'Thunfisch-Nudelpfanne', category: 'fisch', allergens: 'ACDG' },
  { name: 'Kabeljaufilet mit Senfkruste', category: 'fisch', allergens: 'ACDGM' },
  { name: 'Karpfen gebacken', category: 'fisch', allergens: 'ACDG' },
  { name: 'Saibling gebraten', category: 'fisch', allergens: 'ADG' },

  // ==========================================================================
  // VEGETARISCHE GERICHTE (28 Stück)
  // ==========================================================================
  { name: 'Käsespätzle', category: 'vegetarisch', allergens: 'ACG' },
  { name: 'Spinat-Tortellini', category: 'vegetarisch', allergens: 'ACG' },
  { name: 'Gemüse-Lasagne', category: 'vegetarisch', allergens: 'ACGL' },
  { name: 'Pasta all\'arrabbiata', category: 'vegetarisch', allergens: 'A' },
  { name: 'Kasnudeln', category: 'vegetarisch', allergens: 'ACG' },
  { name: 'Fruchtknödel', category: 'vegetarisch', allergens: 'ACG' },
  { name: 'Spinat-Schafkäse-Strudel', category: 'vegetarisch', allergens: 'ACG' },
  { name: 'Gemüselaibchen', category: 'vegetarisch', allergens: 'ACG' },
  { name: 'Spinatlasagne', category: 'vegetarisch', allergens: 'ACGL' },
  { name: 'Kaiserschmarrn', category: 'vegetarisch', allergens: 'ACG' },
  { name: 'Krautfleckerl', category: 'vegetarisch', allergens: 'ACG' },
  { name: 'Kartoffelrösti', category: 'vegetarisch', allergens: 'G' },
  { name: 'Bolognese vegetarisch', category: 'vegetarisch', allergens: 'AFL' },
  { name: 'Eiernockerl', category: 'vegetarisch', allergens: 'ACG' },
  { name: 'Topfenknödel', category: 'vegetarisch', allergens: 'ACG' },
  { name: 'Palatschinken', category: 'vegetarisch', allergens: 'ACG' },
  { name: 'Gemüsestrudel', category: 'vegetarisch', allergens: 'ACG' },
  { name: 'Erdäpfelgulasch', category: 'vegetarisch', allergens: 'ALO' },
  { name: 'Linsendalgemüse', category: 'vegetarisch', allergens: 'L' },
  { name: 'Germknödel', category: 'vegetarisch', allergens: 'ACG' },
  { name: 'Gemüse-Couscous', category: 'vegetarisch', allergens: 'AL' },
  { name: 'Ofengemüse-Teller mit Kräuterdip', category: 'vegetarisch', allergens: 'G' },
  { name: 'Gebackener Emmentaler', category: 'vegetarisch', allergens: 'ACG' },
  { name: 'Schwammerlgulasch', category: 'vegetarisch', allergens: 'AGL' },
  { name: 'Mohnnudeln', category: 'vegetarisch', allergens: 'ACG' },
  { name: 'Kürbisrisotto', category: 'vegetarisch', allergens: 'AG' },
  { name: 'Tiroler Gröstl vegetarisch', category: 'vegetarisch', allergens: 'ACG' },
  { name: 'Kartoffelpuffer', category: 'vegetarisch', allergens: 'AC' },

  // ==========================================================================
  // BEILAGEN (38 Stück)
  // ==========================================================================
  { name: 'Kartoffelgratin', category: 'beilage', allergens: 'AG' },
  { name: 'Semmelknödel', category: 'beilage', allergens: 'ACGL' },
  { name: 'Reis', category: 'beilage', allergens: '' },
  { name: 'Kräuterreis', category: 'beilage', allergens: '' },
  { name: 'Gemüsereis', category: 'beilage', allergens: 'L' },
  { name: 'Erbsenreis', category: 'beilage', allergens: '' },
  { name: 'Butterspätzle', category: 'beilage', allergens: 'ACG' },
  { name: 'Buttergemüse', category: 'beilage', allergens: 'G' },
  { name: 'Sauerkraut', category: 'beilage', allergens: 'O' },
  { name: 'Röstzwiebel', category: 'beilage', allergens: 'A' },
  { name: 'Tomatensauce', category: 'beilage', allergens: 'L' },
  { name: 'Pommes', category: 'beilage', allergens: '' },
  { name: 'Petersilienerdäpfel', category: 'beilage', allergens: 'G' },
  { name: 'Couscous', category: 'beilage', allergens: 'A' },
  { name: 'Serviettenknödel', category: 'beilage', allergens: 'ACGL' },
  { name: 'Ofengemüse', category: 'beilage', allergens: '' },
  { name: 'Ofenkartoffeln', category: 'beilage', allergens: '' },
  { name: 'Erdäpfelpüree', category: 'beilage', allergens: 'G' },
  { name: 'Bratensauce', category: 'beilage', allergens: 'AL' },
  { name: 'Rahmsoße', category: 'beilage', allergens: 'AGL' },
  { name: 'Preiselbeeren', category: 'beilage', allergens: '' },
  { name: 'Apfelkompott', category: 'beilage', allergens: '' },
  { name: 'Schnittlauchsauce', category: 'beilage', allergens: 'G' },
  { name: 'Bratkartoffeln', category: 'beilage', allergens: '' },
  { name: 'Kroketten', category: 'beilage', allergens: 'ACG' },
  { name: 'Bandnudeln', category: 'beilage', allergens: 'AC' },
  { name: 'Salzerdäpfel', category: 'beilage', allergens: '' },
  { name: 'Polenta', category: 'beilage', allergens: 'G' },
  { name: 'Erdäpfelsalat', category: 'beilage', allergens: 'MO' },
  { name: 'Blattsalat', category: 'beilage', allergens: '' },
  { name: 'Gurkensalat', category: 'beilage', allergens: 'O' },
  { name: 'Krautsalat', category: 'beilage', allergens: 'O' },
  { name: 'Rotkraut', category: 'beilage', allergens: 'O' },
  { name: 'Fisolen', category: 'beilage', allergens: 'G' },
  { name: 'Djuvec-Reis', category: 'beilage', allergens: 'L' },
  { name: 'Rahmfisolen', category: 'beilage', allergens: 'AG' },
  { name: 'Apfelkren', category: 'beilage', allergens: 'GM' },
  { name: 'Semmelkren', category: 'beilage', allergens: 'AGM' },

  // ==========================================================================
  // DESSERTS (23 Stück)
  // ==========================================================================
  { name: 'Dessertvariation', category: 'dessert', allergens: 'ACGH' },
  { name: 'Obstsalat', category: 'dessert', allergens: '' },
  { name: 'Joghurt mit Früchten', category: 'dessert', allergens: 'G' },
  { name: 'Pudding', category: 'dessert', allergens: 'AG' },
  { name: 'Tiramisu', category: 'dessert', allergens: 'ACG' },
  { name: 'Apfelstrudel', category: 'dessert', allergens: 'ACG' },
  { name: 'Schokomousse', category: 'dessert', allergens: 'CGF' },
  { name: 'Panna Cotta', category: 'dessert', allergens: 'G' },
  { name: 'Grießflammeri', category: 'dessert', allergens: 'ACG' },
  { name: 'Topfencreme mit Beeren', category: 'dessert', allergens: 'G' },
  { name: 'Vanilleeis mit Früchten', category: 'dessert', allergens: 'CG' },
  { name: 'Mohr im Hemd', category: 'dessert', allergens: 'ACGH' },
  { name: 'Buchteln mit Vanillesauce', category: 'dessert', allergens: 'ACG' },
  { name: 'Reisauflauf mit Kirschen', category: 'dessert', allergens: 'CG' },
  { name: 'Schokokuchen', category: 'dessert', allergens: 'ACGHF' },
  { name: 'Marillenknödel', category: 'dessert', allergens: 'ACG' },
  { name: 'Sachertorte', category: 'dessert', allergens: 'ACGH' },
  { name: 'Linzer Torte', category: 'dessert', allergens: 'ACGH' },
  { name: 'Topfenstrudel', category: 'dessert', allergens: 'ACG' },
  { name: 'Milchrahmstrudel', category: 'dessert', allergens: 'ACG' },
  { name: 'Powidltascherl', category: 'dessert', allergens: 'ACG' },
  { name: 'Zwetschkenröster', category: 'dessert', allergens: 'O' },
  { name: 'Salzburger Nockerl', category: 'dessert', allergens: 'ACG' },
];

// Helper to get dish ID by name after seeding
function getDishId(db: ReturnType<typeof getDb>, name: string): number | null {
  const row = db.prepare('SELECT id FROM dishes WHERE name = ?').get(name) as { id: number } | undefined;
  return row ? row.id : null;
}

interface RotationEntry {
  week_nr: number;
  day_of_week: number; // 0=So, 1=Mo, 2=Di, 3=Mi, 4=Do, 5=Fr, 6=Sa
  meal: 'mittag' | 'abend';
  location: 'city' | 'sued';
  soup: string;
  main1: string;
  side1a: string;
  side1b: string;
  main2: string;
  side2a: string;
  side2b: string;
  dessert: string;
}

// =====================================================================
// 6-WOCHEN-ROTATIONSPLAN (Mo-So, je 7 Tage)
// Pro Mahlzeit: 1 Suppe, 2 Hauptgerichte (1 Fleisch/Fisch + 1 Veggie),
// je 2 Beilagen, 1 Dessert
// City und SUED bekommen UNTERSCHIEDLICHE Hauptgerichte!
// Suppen und Desserts können gleich sein.
// Mindestens 1x Fisch pro Woche als main1.
// Keine Hauptgericht-Wiederholung innerhalb einer Woche pro Standort.
// =====================================================================
const ROTATION_DATA: RotationEntry[] = [
  // =====================================================================
  // WOCHE 1 -- Montag(1) bis Sonntag(0)
  // =====================================================================

  // --- Montag W1 ---
  // City Mittag
  { week_nr: 1, day_of_week: 1, meal: 'mittag', location: 'city',
    soup: 'Rindsuppe mit Frittaten', main1: 'Naturschnitzel vom Schwein', side1a: 'Kartoffelgratin', side1b: 'Buttergemüse',
    main2: 'Käsespätzle', side2a: 'Röstzwiebel', side2b: 'Ofengemüse', dessert: 'Dessertvariation' },
  // City Abend
  { week_nr: 1, day_of_week: 1, meal: 'abend', location: 'city',
    soup: 'Gemüsesuppe', main1: 'Hühnerstreifen', side1a: 'Reis', side1b: 'Buttergemüse',
    main2: 'Spinat-Tortellini', side2a: 'Tomatensauce', side2b: '', dessert: 'Obstsalat' },
  // SUED Mittag
  { week_nr: 1, day_of_week: 1, meal: 'mittag', location: 'sued',
    soup: 'Rindsuppe mit Frittaten', main1: 'Schweinsbraten', side1a: 'Semmelknödel', side1b: 'Sauerkraut',
    main2: 'Gemüselaibchen', side2a: 'Ofengemüse', side2b: '', dessert: 'Dessertvariation' },
  // SUED Abend
  { week_nr: 1, day_of_week: 1, meal: 'abend', location: 'sued',
    soup: 'Gemüsesuppe', main1: 'Puten-Rahmgeschnetzeltes', side1a: 'Kräuterreis', side1b: 'Buttergemüse',
    main2: 'Kasnudeln', side2a: 'Blattsalat', side2b: '', dessert: 'Obstsalat' },

  // --- Dienstag W1 ---
  { week_nr: 1, day_of_week: 2, meal: 'mittag', location: 'city',
    soup: 'Tomatencremesuppe', main1: 'Fischstäbchen', side1a: 'Pommes', side1b: 'Buttergemüse',
    main2: 'Pasta all\'arrabbiata', side2a: 'Ofengemüse', side2b: '', dessert: 'Joghurt mit Früchten' },
  { week_nr: 1, day_of_week: 2, meal: 'abend', location: 'city',
    soup: 'Nudelsuppe', main1: 'Hühnergeschnetzeltes', side1a: 'Reis', side1b: 'Buttergemüse',
    main2: 'Fruchtknödel', side2a: 'Apfelkompott', side2b: '', dessert: 'Pudding' },
  { week_nr: 1, day_of_week: 2, meal: 'mittag', location: 'sued',
    soup: 'Tomatencremesuppe', main1: 'Seelachsfilet gebacken', side1a: 'Erdäpfelpüree', side1b: 'Buttergemüse',
    main2: 'Gemüse-Lasagne', side2a: '', side2b: '', dessert: 'Joghurt mit Früchten' },
  { week_nr: 1, day_of_week: 2, meal: 'abend', location: 'sued',
    soup: 'Nudelsuppe', main1: 'Rindsgulasch', side1a: 'Butterspätzle', side1b: '',
    main2: 'Eiernockerl', side2a: '', side2b: '', dessert: 'Pudding' },

  // --- Mittwoch W1 ---
  { week_nr: 1, day_of_week: 3, meal: 'mittag', location: 'city',
    soup: 'Kürbiscremesuppe', main1: 'Seehechtfilet', side1a: 'Petersilienerdäpfel', side1b: 'Buttergemüse',
    main2: 'Gemüse-Lasagne', side2a: '', side2b: '', dessert: 'Schokomousse' },
  { week_nr: 1, day_of_week: 3, meal: 'abend', location: 'city',
    soup: 'Grießnockerlsuppe', main1: 'Cevapcici', side1a: 'Djuvec-Reis', side1b: 'Röstzwiebel',
    main2: 'Kasnudeln', side2a: 'Blattsalat', side2b: '', dessert: 'Panna Cotta' },
  { week_nr: 1, day_of_week: 3, meal: 'mittag', location: 'sued',
    soup: 'Kürbiscremesuppe', main1: 'Rinderbraten', side1a: 'Serviettenknödel', side1b: 'Bratensauce',
    main2: 'Spinatlasagne', side2a: '', side2b: '', dessert: 'Schokomousse' },
  { week_nr: 1, day_of_week: 3, meal: 'abend', location: 'sued',
    soup: 'Grießnockerlsuppe', main1: 'Faschierte Laibchen', side1a: 'Erdäpfelpüree', side1b: '',
    main2: 'Krautfleckerl', side2a: 'Blattsalat', side2b: '', dessert: 'Panna Cotta' },

  // --- Donnerstag W1 ---
  { week_nr: 1, day_of_week: 4, meal: 'mittag', location: 'city',
    soup: 'Kartoffelcremesuppe', main1: 'Schnitzel vom Schwein', side1a: 'Erdäpfelpüree', side1b: 'Preiselbeeren',
    main2: 'Gemüsestrudel', side2a: 'Ofengemüse', side2b: '', dessert: 'Apfelstrudel' },
  { week_nr: 1, day_of_week: 4, meal: 'abend', location: 'city',
    soup: 'Frittatensuppe', main1: 'Backhendl', side1a: 'Erdäpfelsalat', side1b: 'Gurkensalat',
    main2: 'Eiernockerl', side2a: '', side2b: '', dessert: 'Grießflammeri' },
  { week_nr: 1, day_of_week: 4, meal: 'mittag', location: 'sued',
    soup: 'Kartoffelcremesuppe', main1: 'Putenschnitzel', side1a: 'Pommes', side1b: 'Preiselbeeren',
    main2: 'Spinat-Schafkäse-Strudel', side2a: '', side2b: '', dessert: 'Apfelstrudel' },
  { week_nr: 1, day_of_week: 4, meal: 'abend', location: 'sued',
    soup: 'Frittatensuppe', main1: 'Gemüse-Hühnercurry', side1a: 'Kräuterreis', side1b: '',
    main2: 'Topfenknödel', side2a: 'Apfelkompott', side2b: '', dessert: 'Grießflammeri' },

  // --- Freitag W1 ---
  { week_nr: 1, day_of_week: 5, meal: 'mittag', location: 'city',
    soup: 'Leberknödelsuppe', main1: 'Spaghetti Bolognese', side1a: '', side1b: '',
    main2: 'Kaiserschmarrn', side2a: 'Apfelkompott', side2b: '', dessert: 'Tiramisu' },
  { week_nr: 1, day_of_week: 5, meal: 'abend', location: 'city',
    soup: 'Backerbsensuppe', main1: 'Faschierte Laibchen', side1a: 'Erdäpfelpüree', side1b: '',
    main2: 'Topfenknödel', side2a: 'Apfelkompott', side2b: '', dessert: 'Vanilleeis mit Früchten' },
  { week_nr: 1, day_of_week: 5, meal: 'mittag', location: 'sued',
    soup: 'Leberknödelsuppe', main1: 'Zwiebelrostbraten', side1a: 'Bratkartoffeln', side1b: 'Röstzwiebel',
    main2: 'Bolognese vegetarisch', side2a: 'Bandnudeln', side2b: '', dessert: 'Tiramisu' },
  { week_nr: 1, day_of_week: 5, meal: 'abend', location: 'sued',
    soup: 'Backerbsensuppe', main1: 'Paprikahendl', side1a: 'Bandnudeln', side1b: '',
    main2: 'Palatschinken', side2a: '', side2b: '', dessert: 'Vanilleeis mit Früchten' },

  // --- Samstag W1 ---
  { week_nr: 1, day_of_week: 6, meal: 'mittag', location: 'city',
    soup: 'Spargelcremesuppe', main1: 'Tafelspitz', side1a: 'Apfelkren', side1b: 'Schnittlauchsauce',
    main2: 'Kartoffelrösti', side2a: 'Ofengemüse', side2b: '', dessert: 'Mohr im Hemd' },
  { week_nr: 1, day_of_week: 6, meal: 'abend', location: 'city',
    soup: 'Karottencremesuppe', main1: 'Paprikahendl', side1a: 'Bandnudeln', side1b: '',
    main2: 'Germknödel', side2a: '', side2b: '', dessert: 'Topfencreme mit Beeren' },
  { week_nr: 1, day_of_week: 6, meal: 'mittag', location: 'sued',
    soup: 'Spargelcremesuppe', main1: 'Schweinefilet', side1a: 'Ofenkartoffeln', side1b: 'Rahmsoße',
    main2: 'Linsendalgemüse', side2a: 'Reis', side2b: '', dessert: 'Mohr im Hemd' },
  { week_nr: 1, day_of_week: 6, meal: 'abend', location: 'sued',
    soup: 'Karottencremesuppe', main1: 'Korma-Hühnerkeule', side1a: 'Erbsenreis', side1b: '',
    main2: 'Gemüse-Couscous', side2a: '', side2b: '', dessert: 'Topfencreme mit Beeren' },

  // --- Sonntag W1 ---
  { week_nr: 1, day_of_week: 0, meal: 'mittag', location: 'city',
    soup: 'Minestrone', main1: 'Rindsgeschnetzeltes', side1a: 'Butterspätzle', side1b: '',
    main2: 'Spinat-Schafkäse-Strudel', side2a: '', side2b: '', dessert: 'Buchteln mit Vanillesauce' },
  { week_nr: 1, day_of_week: 0, meal: 'abend', location: 'city',
    soup: 'Erbsencremesuppe', main1: 'Wiener Schnitzel', side1a: 'Erdäpfelsalat', side1b: 'Preiselbeeren',
    main2: 'Palatschinken', side2a: '', side2b: '', dessert: 'Joghurt mit Früchten' },
  { week_nr: 1, day_of_week: 0, meal: 'mittag', location: 'sued',
    soup: 'Minestrone', main1: 'Hühnergeschnetzeltes', side1a: 'Reis', side1b: 'Buttergemüse',
    main2: 'Käsespätzle', side2a: 'Röstzwiebel', side2b: '', dessert: 'Buchteln mit Vanillesauce' },
  { week_nr: 1, day_of_week: 0, meal: 'abend', location: 'sued',
    soup: 'Erbsencremesuppe', main1: 'Schnitzel vom Schwein', side1a: 'Pommes', side1b: 'Preiselbeeren',
    main2: 'Germknödel', side2a: '', side2b: '', dessert: 'Joghurt mit Früchten' },

  // =====================================================================
  // WOCHE 2 -- Montag(1) bis Sonntag(0)
  // =====================================================================

  // --- Montag W2 ---
  { week_nr: 2, day_of_week: 1, meal: 'mittag', location: 'city',
    soup: 'Kürbiscremesuppe', main1: 'Schweinsbraten', side1a: 'Semmelknödel', side1b: 'Sauerkraut',
    main2: 'Kasnudeln', side2a: 'Blattsalat', side2b: '', dessert: 'Grießflammeri' },
  { week_nr: 2, day_of_week: 1, meal: 'abend', location: 'city',
    soup: 'Rindsuppe mit Frittaten', main1: 'Hühnergeschnetzeltes', side1a: 'Reis', side1b: 'Buttergemüse',
    main2: 'Spinat-Tortellini', side2a: 'Tomatensauce', side2b: '', dessert: 'Obstsalat' },
  { week_nr: 2, day_of_week: 1, meal: 'mittag', location: 'sued',
    soup: 'Kürbiscremesuppe', main1: 'Rindsgulasch', side1a: 'Butterspätzle', side1b: '',
    main2: 'Gemüse-Lasagne', side2a: '', side2b: '', dessert: 'Grießflammeri' },
  { week_nr: 2, day_of_week: 1, meal: 'abend', location: 'sued',
    soup: 'Rindsuppe mit Frittaten', main1: 'Hühnerstreifen', side1a: 'Reis', side1b: 'Buttergemüse',
    main2: 'Eiernockerl', side2a: '', side2b: '', dessert: 'Obstsalat' },

  // --- Dienstag W2 ---
  { week_nr: 2, day_of_week: 2, meal: 'mittag', location: 'city',
    soup: 'Grießnockerlsuppe', main1: 'Rindsgeschnetzeltes', side1a: 'Butterspätzle', side1b: '',
    main2: 'Gemüselaibchen', side2a: 'Ofengemüse', side2b: '', dessert: 'Tiramisu' },
  { week_nr: 2, day_of_week: 2, meal: 'abend', location: 'city',
    soup: 'Tomatencremesuppe', main1: 'Cordon Bleu', side1a: 'Pommes', side1b: 'Gurkensalat',
    main2: 'Topfenknödel', side2a: 'Apfelkompott', side2b: '', dessert: 'Reisauflauf mit Kirschen' },
  { week_nr: 2, day_of_week: 2, meal: 'mittag', location: 'sued',
    soup: 'Grießnockerlsuppe', main1: 'Schweinefilet', side1a: 'Ofenkartoffeln', side1b: 'Rahmsoße',
    main2: 'Spinatlasagne', side2a: '', side2b: '', dessert: 'Tiramisu' },
  { week_nr: 2, day_of_week: 2, meal: 'abend', location: 'sued',
    soup: 'Tomatencremesuppe', main1: 'Spaghetti Bolognese', side1a: '', side1b: '',
    main2: 'Fruchtknödel', side2a: 'Apfelkompott', side2b: '', dessert: 'Reisauflauf mit Kirschen' },

  // --- Mittwoch W2 ---
  { week_nr: 2, day_of_week: 3, meal: 'mittag', location: 'city',
    soup: 'Minestrone', main1: 'Lachsfilet', side1a: 'Petersilienerdäpfel', side1b: 'Buttergemüse',
    main2: 'Bolognese vegetarisch', side2a: 'Bandnudeln', side2b: '', dessert: 'Panna Cotta' },
  { week_nr: 2, day_of_week: 3, meal: 'abend', location: 'city',
    soup: 'Kartoffelcremesuppe', main1: 'Cevapcici', side1a: 'Djuvec-Reis', side1b: 'Röstzwiebel',
    main2: 'Kaiserschmarrn', side2a: 'Apfelkompott', side2b: '', dessert: 'Dessertvariation' },
  { week_nr: 2, day_of_week: 3, meal: 'mittag', location: 'sued',
    soup: 'Minestrone', main1: 'Forelle Müllerin', side1a: 'Petersilienerdäpfel', side1b: 'Buttergemüse',
    main2: 'Erdäpfelgulasch', side2a: '', side2b: '', dessert: 'Panna Cotta' },
  { week_nr: 2, day_of_week: 3, meal: 'abend', location: 'sued',
    soup: 'Kartoffelcremesuppe', main1: 'Geselchtes mit Sauerkraut', side1a: 'Semmelknödel', side1b: '',
    main2: 'Ofengemüse-Teller mit Kräuterdip', side2a: '', side2b: '', dessert: 'Dessertvariation' },

  // --- Donnerstag W2 ---
  { week_nr: 2, day_of_week: 4, meal: 'mittag', location: 'city',
    soup: 'Spargelcremesuppe', main1: 'Zwiebelrostbraten', side1a: 'Bratkartoffeln', side1b: 'Buttergemüse',
    main2: 'Erdäpfelgulasch', side2a: '', side2b: '', dessert: 'Apfelstrudel' },
  { week_nr: 2, day_of_week: 4, meal: 'abend', location: 'city',
    soup: 'Leberknödelsuppe', main1: 'Hühnerfilet', side1a: 'Kräuterreis', side1b: '',
    main2: 'Kasnudeln', side2a: 'Blattsalat', side2b: '', dessert: 'Joghurt mit Früchten' },
  { week_nr: 2, day_of_week: 4, meal: 'mittag', location: 'sued',
    soup: 'Spargelcremesuppe', main1: 'Putenrollbraten', side1a: 'Gemüsereis', side1b: 'Bratensauce',
    main2: 'Spinat-Schafkäse-Strudel', side2a: '', side2b: '', dessert: 'Apfelstrudel' },
  { week_nr: 2, day_of_week: 4, meal: 'abend', location: 'sued',
    soup: 'Leberknödelsuppe', main1: 'Puten-Curry', side1a: 'Kräuterreis', side1b: '',
    main2: 'Palatschinken', side2a: '', side2b: '', dessert: 'Joghurt mit Früchten' },

  // --- Freitag W2 ---
  { week_nr: 2, day_of_week: 5, meal: 'mittag', location: 'city',
    soup: 'Backerbsensuppe', main1: 'Forelle Müllerin', side1a: 'Petersilienerdäpfel', side1b: '',
    main2: 'Käsespätzle', side2a: 'Röstzwiebel', side2b: '', dessert: 'Schokomousse' },
  { week_nr: 2, day_of_week: 5, meal: 'abend', location: 'city',
    soup: 'Gemüsesuppe', main1: 'Paprikahendl', side1a: 'Bandnudeln', side1b: '',
    main2: 'Palatschinken', side2a: '', side2b: '', dessert: 'Schokokuchen' },
  { week_nr: 2, day_of_week: 5, meal: 'mittag', location: 'sued',
    soup: 'Backerbsensuppe', main1: 'Lachsfilet', side1a: 'Kräuterreis', side1b: 'Buttergemüse',
    main2: 'Gemüsestrudel', side2a: 'Ofengemüse', side2b: '', dessert: 'Schokomousse' },
  { week_nr: 2, day_of_week: 5, meal: 'abend', location: 'sued',
    soup: 'Gemüsesuppe', main1: 'Fleischknödel', side1a: 'Sauerkraut', side1b: '',
    main2: 'Krautfleckerl', side2a: 'Blattsalat', side2b: '', dessert: 'Schokokuchen' },

  // --- Samstag W2 ---
  { week_nr: 2, day_of_week: 6, meal: 'mittag', location: 'city',
    soup: 'Brokkolicremesuppe', main1: 'Tafelspitz', side1a: 'Apfelkren', side1b: 'Schnittlauchsauce',
    main2: 'Linsendalgemüse', side2a: 'Reis', side2b: '', dessert: 'Buchteln mit Vanillesauce' },
  { week_nr: 2, day_of_week: 6, meal: 'abend', location: 'city',
    soup: 'Knoblauchcremesuppe', main1: 'Gemüse-Hühnercurry', side1a: 'Kräuterreis', side1b: '',
    main2: 'Gemüse-Couscous', side2a: '', side2b: '', dessert: 'Sachertorte' },
  { week_nr: 2, day_of_week: 6, meal: 'mittag', location: 'sued',
    soup: 'Brokkolicremesuppe', main1: 'Naturschnitzel vom Schwein', side1a: 'Kartoffelgratin', side1b: 'Buttergemüse',
    main2: 'Kartoffelrösti', side2a: 'Ofengemüse', side2b: '', dessert: 'Buchteln mit Vanillesauce' },
  { week_nr: 2, day_of_week: 6, meal: 'abend', location: 'sued',
    soup: 'Knoblauchcremesuppe', main1: 'Schweinshaxe', side1a: 'Semmelknödel', side1b: 'Sauerkraut',
    main2: 'Germknödel', side2a: '', side2b: '', dessert: 'Topfencreme mit Beeren' },

  // --- Sonntag W2 ---
  { week_nr: 2, day_of_week: 0, meal: 'mittag', location: 'city',
    soup: 'Frittatensuppe', main1: 'Schweinefilet', side1a: 'Ofenkartoffeln', side1b: 'Rahmsoße',
    main2: 'Spinat-Schafkäse-Strudel', side2a: '', side2b: '', dessert: 'Mohr im Hemd' },
  { week_nr: 2, day_of_week: 0, meal: 'abend', location: 'city',
    soup: 'Nudelsuppe', main1: 'Wiener Schnitzel', side1a: 'Erdäpfelsalat', side1b: 'Preiselbeeren',
    main2: 'Germknödel', side2a: '', side2b: '', dessert: 'Pudding' },
  { week_nr: 2, day_of_week: 0, meal: 'mittag', location: 'sued',
    soup: 'Frittatensuppe', main1: 'Rinderbraten', side1a: 'Serviettenknödel', side1b: 'Bratensauce',
    main2: 'Käsespätzle', side2a: 'Röstzwiebel', side2b: '', dessert: 'Mohr im Hemd' },
  { week_nr: 2, day_of_week: 0, meal: 'abend', location: 'sued',
    soup: 'Nudelsuppe', main1: 'Pariser Schnitzel', side1a: 'Erdäpfelpüree', side1b: 'Preiselbeeren',
    main2: 'Topfenknödel', side2a: 'Apfelkompott', side2b: '', dessert: 'Pudding' },

  // =====================================================================
  // WOCHE 3 -- Montag(1) bis Sonntag(0)
  // =====================================================================

  // --- Montag W3 ---
  { week_nr: 3, day_of_week: 1, meal: 'mittag', location: 'city',
    soup: 'Kartoffelcremesuppe', main1: 'Rinderbraten', side1a: 'Serviettenknödel', side1b: 'Bratensauce',
    main2: 'Spinatlasagne', side2a: '', side2b: '', dessert: 'Dessertvariation' },
  { week_nr: 3, day_of_week: 1, meal: 'abend', location: 'city',
    soup: 'Rindsuppe mit Frittaten', main1: 'Hühnerfilet', side1a: 'Reis', side1b: 'Buttergemüse',
    main2: 'Eiernockerl', side2a: '', side2b: '', dessert: 'Topfencreme mit Beeren' },
  { week_nr: 3, day_of_week: 1, meal: 'mittag', location: 'sued',
    soup: 'Kartoffelcremesuppe', main1: 'Schweinsbraten', side1a: 'Semmelknödel', side1b: 'Sauerkraut',
    main2: 'Gemüselaibchen', side2a: 'Ofengemüse', side2b: '', dessert: 'Dessertvariation' },
  { week_nr: 3, day_of_week: 1, meal: 'abend', location: 'sued',
    soup: 'Rindsuppe mit Frittaten', main1: 'Puten-Rahmgeschnetzeltes', side1a: 'Kräuterreis', side1b: '',
    main2: 'Spinat-Tortellini', side2a: 'Tomatensauce', side2b: '', dessert: 'Topfencreme mit Beeren' },

  // --- Dienstag W3 ---
  { week_nr: 3, day_of_week: 2, meal: 'mittag', location: 'city',
    soup: 'Frittatensuppe', main1: 'Pariser Schnitzel', side1a: 'Erdäpfelpüree', side1b: 'Preiselbeeren',
    main2: 'Gemüse-Lasagne', side2a: '', side2b: '', dessert: 'Tiramisu' },
  { week_nr: 3, day_of_week: 2, meal: 'abend', location: 'city',
    soup: 'Kürbiscremesuppe', main1: 'Putenschnitzel', side1a: 'Pommes', side1b: '',
    main2: 'Fruchtknödel', side2a: 'Apfelkompott', side2b: '', dessert: 'Joghurt mit Früchten' },
  { week_nr: 3, day_of_week: 2, meal: 'mittag', location: 'sued',
    soup: 'Frittatensuppe', main1: 'Geschnetzeltes Zürcher Art', side1a: 'Butterspätzle', side1b: '',
    main2: 'Kasnudeln', side2a: 'Blattsalat', side2b: '', dessert: 'Tiramisu' },
  { week_nr: 3, day_of_week: 2, meal: 'abend', location: 'sued',
    soup: 'Kürbiscremesuppe', main1: 'Hühnerfilet', side1a: 'Kräuterreis', side1b: 'Buttergemüse',
    main2: 'Topfenknödel', side2a: 'Apfelkompott', side2b: '', dessert: 'Joghurt mit Früchten' },

  // --- Mittwoch W3 ---
  { week_nr: 3, day_of_week: 3, meal: 'mittag', location: 'city',
    soup: 'Nudelsuppe', main1: 'Seelachsfilet gebacken', side1a: 'Erdäpfelpüree', side1b: '',
    main2: 'Käsespätzle', side2a: 'Röstzwiebel', side2b: '', dessert: 'Panna Cotta' },
  { week_nr: 3, day_of_week: 3, meal: 'abend', location: 'city',
    soup: 'Gemüsesuppe', main1: 'Geschnetzeltes Zürcher Art', side1a: 'Butterspätzle', side1b: '',
    main2: 'Kasnudeln', side2a: 'Blattsalat', side2b: '', dessert: 'Vanilleeis mit Früchten' },
  { week_nr: 3, day_of_week: 3, meal: 'mittag', location: 'sued',
    soup: 'Nudelsuppe', main1: 'Zanderfilet auf Gemüsebett', side1a: 'Salzerdäpfel', side1b: '',
    main2: 'Bolognese vegetarisch', side2a: 'Bandnudeln', side2b: '', dessert: 'Panna Cotta' },
  { week_nr: 3, day_of_week: 3, meal: 'abend', location: 'sued',
    soup: 'Gemüsesuppe', main1: 'Cevapcici', side1a: 'Djuvec-Reis', side1b: 'Röstzwiebel',
    main2: 'Kaiserschmarrn', side2a: 'Apfelkompott', side2b: '', dessert: 'Vanilleeis mit Früchten' },

  // --- Donnerstag W3 ---
  { week_nr: 3, day_of_week: 4, meal: 'mittag', location: 'city',
    soup: 'Leberknödelsuppe', main1: 'Geselchtes mit Sauerkraut', side1a: 'Semmelknödel', side1b: '',
    main2: 'Gemüsestrudel', side2a: 'Ofengemüse', side2b: '', dessert: 'Apfelstrudel' },
  { week_nr: 3, day_of_week: 4, meal: 'abend', location: 'city',
    soup: 'Backerbsensuppe', main1: 'Schweinefilet', side1a: 'Ofenkartoffeln', side1b: 'Rahmsoße',
    main2: 'Kartoffelrösti', side2a: 'Ofengemüse', side2b: '', dessert: 'Schokomousse' },
  { week_nr: 3, day_of_week: 4, meal: 'mittag', location: 'sued',
    soup: 'Leberknödelsuppe', main1: 'Steirisches Wurzelfleisch', side1a: 'Salzerdäpfel', side1b: '',
    main2: 'Linsendalgemüse', side2a: 'Reis', side2b: '', dessert: 'Apfelstrudel' },
  { week_nr: 3, day_of_week: 4, meal: 'abend', location: 'sued',
    soup: 'Backerbsensuppe', main1: 'Korma-Hühnerkeule', side1a: 'Erbsenreis', side1b: '',
    main2: 'Gebackener Emmentaler', side2a: 'Erdäpfelsalat', side2b: 'Preiselbeeren', dessert: 'Schokomousse' },

  // --- Freitag W3 ---
  { week_nr: 3, day_of_week: 5, meal: 'mittag', location: 'city',
    soup: 'Gulaschsuppe', main1: 'Gemüse-Hühnercurry', side1a: 'Kräuterreis', side1b: '',
    main2: 'Ofengemüse-Teller mit Kräuterdip', side2a: '', side2b: '', dessert: 'Buchteln mit Vanillesauce' },
  { week_nr: 3, day_of_week: 5, meal: 'abend', location: 'city',
    soup: 'Karottencremesuppe', main1: 'Fleischknödel', side1a: 'Sauerkraut', side1b: '',
    main2: 'Palatschinken', side2a: '', side2b: '', dessert: 'Pudding' },
  { week_nr: 3, day_of_week: 5, meal: 'mittag', location: 'sued',
    soup: 'Minestrone', main1: 'Hühner-Gemüse-Pfanne', side1a: 'Reis', side1b: '',
    main2: 'Erdäpfelgulasch', side2a: '', side2b: '', dessert: 'Buchteln mit Vanillesauce' },
  { week_nr: 3, day_of_week: 5, meal: 'abend', location: 'sued',
    soup: 'Karottencremesuppe', main1: 'Leberkäse', side1a: 'Erdäpfelpüree', side1b: 'Gurkensalat',
    main2: 'Germknödel', side2a: '', side2b: '', dessert: 'Pudding' },

  // --- Samstag W3 ---
  { week_nr: 3, day_of_week: 6, meal: 'mittag', location: 'city',
    soup: 'Zwiebelsuppe', main1: 'Schweinshaxe', side1a: 'Semmelknödel', side1b: 'Sauerkraut',
    main2: 'Spinat-Schafkäse-Strudel', side2a: '', side2b: '', dessert: 'Marillenknödel' },
  { week_nr: 3, day_of_week: 6, meal: 'abend', location: 'city',
    soup: 'Erbsencremesuppe', main1: 'Korma-Hühnerkeule', side1a: 'Erbsenreis', side1b: '',
    main2: 'Gemüse-Couscous', side2a: '', side2b: '', dessert: 'Topfenstrudel' },
  { week_nr: 3, day_of_week: 6, meal: 'mittag', location: 'sued',
    soup: 'Zwiebelsuppe', main1: 'Tafelspitz', side1a: 'Apfelkren', side1b: 'Schnittlauchsauce',
    main2: 'Pasta all\'arrabbiata', side2a: 'Ofengemüse', side2b: '', dessert: 'Marillenknödel' },
  { week_nr: 3, day_of_week: 6, meal: 'abend', location: 'sued',
    soup: 'Erbsencremesuppe', main1: 'Rindsgeschnetzeltes', side1a: 'Butterspätzle', side1b: '',
    main2: 'Palatschinken', side2a: '', side2b: '', dessert: 'Grießflammeri' },

  // --- Sonntag W3 ---
  { week_nr: 3, day_of_week: 0, meal: 'mittag', location: 'city',
    soup: 'Grießnockerlsuppe', main1: 'Puten-Rahmgeschnetzeltes', side1a: 'Kräuterreis', side1b: '',
    main2: 'Gemüselaibchen', side2a: 'Ofengemüse', side2b: '', dessert: 'Dessertvariation' },
  { week_nr: 3, day_of_week: 0, meal: 'abend', location: 'city',
    soup: 'Tomatencremesuppe', main1: 'Wiener Schnitzel', side1a: 'Erdäpfelsalat', side1b: 'Preiselbeeren',
    main2: 'Topfenknödel', side2a: 'Apfelkompott', side2b: '', dessert: 'Pudding' },
  { week_nr: 3, day_of_week: 0, meal: 'mittag', location: 'sued',
    soup: 'Grießnockerlsuppe', main1: 'Zwiebelrostbraten', side1a: 'Bratkartoffeln', side1b: 'Röstzwiebel',
    main2: 'Krautfleckerl', side2a: 'Blattsalat', side2b: '', dessert: 'Dessertvariation' },
  { week_nr: 3, day_of_week: 0, meal: 'abend', location: 'sued',
    soup: 'Tomatencremesuppe', main1: 'Schnitzel vom Schwein', side1a: 'Pommes', side1b: 'Preiselbeeren',
    main2: 'Eiernockerl', side2a: '', side2b: '', dessert: 'Pudding' },

  // =====================================================================
  // WOCHE 4 -- Montag(1) bis Sonntag(0)
  // =====================================================================

  // --- Montag W4 ---
  { week_nr: 4, day_of_week: 1, meal: 'mittag', location: 'city',
    soup: 'Tomatencremesuppe', main1: 'Puten-Curry', side1a: 'Kräuterreis', side1b: '',
    main2: 'Gemüse-Lasagne', side2a: '', side2b: '', dessert: 'Schokomousse' },
  { week_nr: 4, day_of_week: 1, meal: 'abend', location: 'city',
    soup: 'Frittatensuppe', main1: 'Hühnerfilet', side1a: 'Reis', side1b: 'Buttergemüse',
    main2: 'Kasnudeln', side2a: 'Blattsalat', side2b: '', dessert: 'Dessertvariation' },
  { week_nr: 4, day_of_week: 1, meal: 'mittag', location: 'sued',
    soup: 'Tomatencremesuppe', main1: 'Gemüse-Hühnercurry', side1a: 'Kräuterreis', side1b: '',
    main2: 'Käsespätzle', side2a: 'Röstzwiebel', side2b: '', dessert: 'Schokomousse' },
  { week_nr: 4, day_of_week: 1, meal: 'abend', location: 'sued',
    soup: 'Frittatensuppe', main1: 'Schweinsbraten', side1a: 'Semmelknödel', side1b: 'Sauerkraut',
    main2: 'Spinat-Tortellini', side2a: 'Tomatensauce', side2b: '', dessert: 'Dessertvariation' },

  // --- Dienstag W4 ---
  { week_nr: 4, day_of_week: 2, meal: 'mittag', location: 'city',
    soup: 'Grießnockerlsuppe', main1: 'Rindsgulasch', side1a: 'Butterspätzle', side1b: '',
    main2: 'Spinatlasagne', side2a: '', side2b: '', dessert: 'Reisauflauf mit Kirschen' },
  { week_nr: 4, day_of_week: 2, meal: 'abend', location: 'city',
    soup: 'Kürbiscremesuppe', main1: 'Hühnerstreifen', side1a: 'Reis', side1b: 'Buttergemüse',
    main2: 'Fruchtknödel', side2a: 'Apfelkompott', side2b: '', dessert: 'Obstsalat' },
  { week_nr: 4, day_of_week: 2, meal: 'mittag', location: 'sued',
    soup: 'Grießnockerlsuppe', main1: 'Rindsgeschnetzeltes', side1a: 'Butterspätzle', side1b: '',
    main2: 'Gemüsestrudel', side2a: 'Ofengemüse', side2b: '', dessert: 'Reisauflauf mit Kirschen' },
  { week_nr: 4, day_of_week: 2, meal: 'abend', location: 'sued',
    soup: 'Kürbiscremesuppe', main1: 'Putenschnitzel', side1a: 'Pommes', side1b: '',
    main2: 'Kaiserschmarrn', side2a: 'Apfelkompott', side2b: '', dessert: 'Obstsalat' },

  // --- Mittwoch W4 ---
  { week_nr: 4, day_of_week: 3, meal: 'mittag', location: 'city',
    soup: 'Selleriecremesuppe', main1: 'Zanderfilet auf Gemüsebett', side1a: 'Salzerdäpfel', side1b: '',
    main2: 'Bolognese vegetarisch', side2a: 'Bandnudeln', side2b: '', dessert: 'Panna Cotta' },
  { week_nr: 4, day_of_week: 3, meal: 'abend', location: 'city',
    soup: 'Gemüsesuppe', main1: 'Cevapcici', side1a: 'Djuvec-Reis', side1b: 'Röstzwiebel',
    main2: 'Kaiserschmarrn', side2a: 'Apfelkompott', side2b: '', dessert: 'Grießflammeri' },
  { week_nr: 4, day_of_week: 3, meal: 'mittag', location: 'sued',
    soup: 'Selleriecremesuppe', main1: 'Pangasiusfilet gedünstet', side1a: 'Petersilienerdäpfel', side1b: 'Buttergemüse',
    main2: 'Pasta all\'arrabbiata', side2a: 'Ofengemüse', side2b: '', dessert: 'Panna Cotta' },
  { week_nr: 4, day_of_week: 3, meal: 'abend', location: 'sued',
    soup: 'Gemüsesuppe', main1: 'Paprikahendl', side1a: 'Bandnudeln', side1b: '',
    main2: 'Schwammerlgulasch', side2a: 'Semmelknödel', side2b: '', dessert: 'Grießflammeri' },

  // --- Donnerstag W4 ---
  { week_nr: 4, day_of_week: 4, meal: 'mittag', location: 'city',
    soup: 'Brokkolicremesuppe', main1: 'Seehechtfilet', side1a: 'Petersilienerdäpfel', side1b: 'Ofengemüse',
    main2: 'Gemüselaibchen', side2a: 'Ofengemüse', side2b: '', dessert: 'Apfelstrudel' },
  { week_nr: 4, day_of_week: 4, meal: 'abend', location: 'city',
    soup: 'Backerbsensuppe', main1: 'Hühnergeschnetzeltes', side1a: 'Reis', side1b: 'Buttergemüse',
    main2: 'Linsendalgemüse', side2a: 'Reis', side2b: '', dessert: 'Mohr im Hemd' },
  { week_nr: 4, day_of_week: 4, meal: 'mittag', location: 'sued',
    soup: 'Brokkolicremesuppe', main1: 'Fischstäbchen', side1a: 'Pommes', side1b: '',
    main2: 'Spinat-Schafkäse-Strudel', side2a: '', side2b: '', dessert: 'Apfelstrudel' },
  { week_nr: 4, day_of_week: 4, meal: 'abend', location: 'sued',
    soup: 'Backerbsensuppe', main1: 'Beuschel', side1a: 'Semmelknödel', side1b: '',
    main2: 'Ofengemüse-Teller mit Kräuterdip', side2a: '', side2b: '', dessert: 'Mohr im Hemd' },

  // --- Freitag W4 ---
  { week_nr: 4, day_of_week: 5, meal: 'mittag', location: 'city',
    soup: 'Spargelcremesuppe', main1: 'Schnitzel vom Schwein', side1a: 'Erdäpfelpüree', side1b: 'Preiselbeeren',
    main2: 'Erdäpfelgulasch', side2a: '', side2b: '', dessert: 'Marillenknödel' },
  { week_nr: 4, day_of_week: 5, meal: 'abend', location: 'city',
    soup: 'Nudelsuppe', main1: 'Putenrollbraten', side1a: 'Gemüsereis', side1b: '',
    main2: 'Palatschinken', side2a: '', side2b: '', dessert: 'Vanilleeis mit Früchten' },
  { week_nr: 4, day_of_week: 5, meal: 'mittag', location: 'sued',
    soup: 'Spargelcremesuppe', main1: 'Wiener Schnitzel', side1a: 'Erdäpfelsalat', side1b: 'Preiselbeeren',
    main2: 'Gemüse-Couscous', side2a: '', side2b: '', dessert: 'Marillenknödel' },
  { week_nr: 4, day_of_week: 5, meal: 'abend', location: 'sued',
    soup: 'Nudelsuppe', main1: 'Hühner-Gemüse-Pfanne', side1a: 'Reis', side1b: '',
    main2: 'Germknödel', side2a: '', side2b: '', dessert: 'Vanilleeis mit Früchten' },

  // --- Samstag W4 ---
  { week_nr: 4, day_of_week: 6, meal: 'mittag', location: 'city',
    soup: 'Klare Gemüsebrühe mit Einlage', main1: 'Schweinefilet', side1a: 'Kartoffelgratin', side1b: 'Buttergemüse',
    main2: 'Spinat-Tortellini', side2a: 'Tomatensauce', side2b: '', dessert: 'Schokokuchen' },
  { week_nr: 4, day_of_week: 6, meal: 'abend', location: 'city',
    soup: 'Knoblauchcremesuppe', main1: 'Gebackene Leber', side1a: 'Erdäpfelpüree', side1b: 'Apfelkompott',
    main2: 'Gemüse-Couscous', side2a: '', side2b: '', dessert: 'Topfencreme mit Beeren' },
  { week_nr: 4, day_of_week: 6, meal: 'mittag', location: 'sued',
    soup: 'Klare Gemüsebrühe mit Einlage', main1: 'Tafelspitz', side1a: 'Apfelkren', side1b: 'Schnittlauchsauce',
    main2: 'Krautfleckerl', side2a: 'Blattsalat', side2b: '', dessert: 'Schokokuchen' },
  { week_nr: 4, day_of_week: 6, meal: 'abend', location: 'sued',
    soup: 'Knoblauchcremesuppe', main1: 'Hühnerkeulen überbacken', side1a: 'Reis', side1b: 'Buttergemüse',
    main2: 'Linsendalgemüse', side2a: 'Reis', side2b: '', dessert: 'Linzer Torte' },

  // --- Sonntag W4 ---
  { week_nr: 4, day_of_week: 0, meal: 'mittag', location: 'city',
    soup: 'Rindsuppe mit Frittaten', main1: 'Schweinshaxe', side1a: 'Semmelknödel', side1b: 'Sauerkraut',
    main2: 'Käsespätzle', side2a: 'Röstzwiebel', side2b: '', dessert: 'Dessertvariation' },
  { week_nr: 4, day_of_week: 0, meal: 'abend', location: 'city',
    soup: 'Nudelsuppe', main1: 'Wiener Schnitzel', side1a: 'Erdäpfelsalat', side1b: 'Preiselbeeren',
    main2: 'Topfenknödel', side2a: 'Apfelkompott', side2b: '', dessert: 'Joghurt mit Früchten' },
  { week_nr: 4, day_of_week: 0, meal: 'mittag', location: 'sued',
    soup: 'Rindsuppe mit Frittaten', main1: 'Rindsroulade', side1a: 'Polenta', side1b: 'Bratensauce',
    main2: 'Gemüselaibchen', side2a: 'Ofengemüse', side2b: '', dessert: 'Dessertvariation' },
  { week_nr: 4, day_of_week: 0, meal: 'abend', location: 'sued',
    soup: 'Nudelsuppe', main1: 'Pariser Schnitzel', side1a: 'Pommes', side1b: '',
    main2: 'Eiernockerl', side2a: '', side2b: '', dessert: 'Joghurt mit Früchten' },

  // =====================================================================
  // WOCHE 5 -- Montag(1) bis Sonntag(0)
  // =====================================================================

  // --- Montag W5 ---
  { week_nr: 5, day_of_week: 1, meal: 'mittag', location: 'city',
    soup: 'Kürbiscremesuppe', main1: 'Steirisches Wurzelfleisch', side1a: 'Salzerdäpfel', side1b: '',
    main2: 'Linsendalgemüse', side2a: 'Reis', side2b: '', dessert: 'Obstsalat' },
  { week_nr: 5, day_of_week: 1, meal: 'abend', location: 'city',
    soup: 'Rindsuppe mit Frittaten', main1: 'Hühnerfilet', side1a: 'Kräuterreis', side1b: 'Buttergemüse',
    main2: 'Spinat-Tortellini', side2a: 'Tomatensauce', side2b: '', dessert: 'Dessertvariation' },
  { week_nr: 5, day_of_week: 1, meal: 'mittag', location: 'sued',
    soup: 'Kürbiscremesuppe', main1: 'Rinderbraten', side1a: 'Serviettenknödel', side1b: 'Bratensauce',
    main2: 'Gemüsestrudel', side2a: 'Ofengemüse', side2b: '', dessert: 'Obstsalat' },
  { week_nr: 5, day_of_week: 1, meal: 'abend', location: 'sued',
    soup: 'Rindsuppe mit Frittaten', main1: 'Hühnerstreifen', side1a: 'Reis', side1b: 'Buttergemüse',
    main2: 'Kasnudeln', side2a: 'Blattsalat', side2b: '', dessert: 'Dessertvariation' },

  // --- Dienstag W5 ---
  { week_nr: 5, day_of_week: 2, meal: 'mittag', location: 'city',
    soup: 'Frittatensuppe', main1: 'Schweinsbraten', side1a: 'Semmelknödel', side1b: 'Sauerkraut',
    main2: 'Gemüse-Lasagne', side2a: '', side2b: '', dessert: 'Tiramisu' },
  { week_nr: 5, day_of_week: 2, meal: 'abend', location: 'city',
    soup: 'Grießnockerlsuppe', main1: 'Kalbsgulasch', side1a: 'Butterspätzle', side1b: '',
    main2: 'Fruchtknödel', side2a: 'Apfelkompott', side2b: '', dessert: 'Joghurt mit Früchten' },
  { week_nr: 5, day_of_week: 2, meal: 'mittag', location: 'sued',
    soup: 'Frittatensuppe', main1: 'Jägerschnitzel', side1a: 'Butterspätzle', side1b: 'Buttergemüse',
    main2: 'Spinatlasagne', side2a: '', side2b: '', dessert: 'Tiramisu' },
  { week_nr: 5, day_of_week: 2, meal: 'abend', location: 'sued',
    soup: 'Grießnockerlsuppe', main1: 'Spaghetti Bolognese', side1a: '', side1b: '',
    main2: 'Topfenknödel', side2a: 'Apfelkompott', side2b: '', dessert: 'Joghurt mit Früchten' },

  // --- Mittwoch W5 ---
  { week_nr: 5, day_of_week: 3, meal: 'mittag', location: 'city',
    soup: 'Schwammerlcremesuppe', main1: 'Lachsforelle mit Kräuterkruste', side1a: 'Petersilienerdäpfel', side1b: '',
    main2: 'Kartoffelrösti', side2a: 'Ofengemüse', side2b: '', dessert: 'Schokokuchen' },
  { week_nr: 5, day_of_week: 3, meal: 'abend', location: 'city',
    soup: 'Gemüsesuppe', main1: 'Hühner-Gemüse-Pfanne', side1a: 'Reis', side1b: '',
    main2: 'Kürbisrisotto', side2a: 'Blattsalat', side2b: '', dessert: 'Dessertvariation' },
  { week_nr: 5, day_of_week: 3, meal: 'mittag', location: 'sued',
    soup: 'Schwammerlcremesuppe', main1: 'Saibling gebraten', side1a: 'Petersilienerdäpfel', side1b: 'Buttergemüse',
    main2: 'Erdäpfelgulasch', side2a: '', side2b: '', dessert: 'Schokokuchen' },
  { week_nr: 5, day_of_week: 3, meal: 'abend', location: 'sued',
    soup: 'Gemüsesuppe', main1: 'Geselchtes mit Sauerkraut', side1a: 'Semmelknödel', side1b: '',
    main2: 'Gemüselaibchen', side2a: 'Ofengemüse', side2b: '', dessert: 'Dessertvariation' },

  // --- Donnerstag W5 ---
  { week_nr: 5, day_of_week: 4, meal: 'mittag', location: 'city',
    soup: 'Zwiebelsuppe', main1: 'Seehecht gebraten', side1a: 'Petersilienerdäpfel', side1b: 'Buttergemüse',
    main2: 'Krautfleckerl', side2a: 'Blattsalat', side2b: '', dessert: 'Apfelstrudel' },
  { week_nr: 5, day_of_week: 4, meal: 'abend', location: 'city',
    soup: 'Leberknödelsuppe', main1: 'Hühnergeschnetzeltes', side1a: 'Reis', side1b: '',
    main2: 'Kasnudeln', side2a: 'Blattsalat', side2b: '', dessert: 'Schokomousse' },
  { week_nr: 5, day_of_week: 4, meal: 'mittag', location: 'sued',
    soup: 'Zwiebelsuppe', main1: 'Thunfisch-Nudelpfanne', side1a: '', side1b: '',
    main2: 'Bolognese vegetarisch', side2a: 'Bandnudeln', side2b: '', dessert: 'Apfelstrudel' },
  { week_nr: 5, day_of_week: 4, meal: 'abend', location: 'sued',
    soup: 'Leberknödelsuppe', main1: 'Puten-Rahmgeschnetzeltes', side1a: 'Kräuterreis', side1b: '',
    main2: 'Palatschinken', side2a: '', side2b: '', dessert: 'Schokomousse' },

  // --- Freitag W5 ---
  { week_nr: 5, day_of_week: 5, meal: 'mittag', location: 'city',
    soup: 'Klare Gemüsebrühe mit Einlage', main1: 'Pariser Schnitzel', side1a: 'Pommes', side1b: '',
    main2: 'Spinat-Schafkäse-Strudel', side2a: '', side2b: '', dessert: 'Buchteln mit Vanillesauce' },
  { week_nr: 5, day_of_week: 5, meal: 'abend', location: 'city',
    soup: 'Kartoffelcremesuppe', main1: 'Kümmelbraten', side1a: 'Semmelknödel', side1b: 'Sauerkraut',
    main2: 'Germknödel', side2a: '', side2b: '', dessert: 'Pudding' },
  { week_nr: 5, day_of_week: 5, meal: 'mittag', location: 'sued',
    soup: 'Klare Gemüsebrühe mit Einlage', main1: 'Schnitzel vom Schwein', side1a: 'Pommes', side1b: 'Preiselbeeren',
    main2: 'Gemüse-Lasagne', side2a: '', side2b: '', dessert: 'Buchteln mit Vanillesauce' },
  { week_nr: 5, day_of_week: 5, meal: 'abend', location: 'sued',
    soup: 'Kartoffelcremesuppe', main1: 'Schweinshaxe', side1a: 'Semmelknödel', side1b: 'Sauerkraut',
    main2: 'Eiernockerl', side2a: '', side2b: '', dessert: 'Pudding' },

  // --- Samstag W5 ---
  { week_nr: 5, day_of_week: 6, meal: 'mittag', location: 'city',
    soup: 'Kaspressknödelsuppe', main1: 'Korma-Hühnerkeule', side1a: 'Erbsenreis', side1b: '',
    main2: 'Gemüse-Couscous', side2a: '', side2b: '', dessert: 'Marillenknödel' },
  { week_nr: 5, day_of_week: 6, meal: 'abend', location: 'city',
    soup: 'Karottencremesuppe', main1: 'Rindsroulade', side1a: 'Polenta', side1b: 'Bratensauce',
    main2: 'Käsespätzle', side2a: 'Röstzwiebel', side2b: '', dessert: 'Milchrahmstrudel' },
  { week_nr: 5, day_of_week: 6, meal: 'mittag', location: 'sued',
    soup: 'Kaspressknödelsuppe', main1: 'Putenrollbraten', side1a: 'Gemüsereis', side1b: 'Bratensauce',
    main2: 'Spinat-Tortellini', side2a: 'Tomatensauce', side2b: '', dessert: 'Marillenknödel' },
  { week_nr: 5, day_of_week: 6, meal: 'abend', location: 'sued',
    soup: 'Karottencremesuppe', main1: 'Schweinefilet', side1a: 'Ofenkartoffeln', side1b: 'Rahmsoße',
    main2: 'Linsendalgemüse', side2a: 'Reis', side2b: '', dessert: 'Grießflammeri' },

  // --- Sonntag W5 ---
  { week_nr: 5, day_of_week: 0, meal: 'mittag', location: 'city',
    soup: 'Spargelcremesuppe', main1: 'Tafelspitz', side1a: 'Apfelkren', side1b: 'Schnittlauchsauce',
    main2: 'Spinat-Schafkäse-Strudel', side2a: '', side2b: '', dessert: 'Mohr im Hemd' },
  { week_nr: 5, day_of_week: 0, meal: 'abend', location: 'city',
    soup: 'Tomatencremesuppe', main1: 'Wiener Schnitzel', side1a: 'Erdäpfelsalat', side1b: 'Preiselbeeren',
    main2: 'Topfenknödel', side2a: 'Apfelkompott', side2b: '', dessert: 'Marillenknödel' },
  { week_nr: 5, day_of_week: 0, meal: 'mittag', location: 'sued',
    soup: 'Spargelcremesuppe', main1: 'Zwiebelrostbraten', side1a: 'Bratkartoffeln', side1b: 'Röstzwiebel',
    main2: 'Käsespätzle', side2a: 'Röstzwiebel', side2b: '', dessert: 'Mohr im Hemd' },
  { week_nr: 5, day_of_week: 0, meal: 'abend', location: 'sued',
    soup: 'Tomatencremesuppe', main1: 'Schnitzel vom Schwein', side1a: 'Pommes', side1b: 'Preiselbeeren',
    main2: 'Germknödel', side2a: '', side2b: '', dessert: 'Marillenknödel' },

  // =====================================================================
  // WOCHE 6 -- Montag(1) bis Sonntag(0)
  // =====================================================================

  // --- Montag W6 ---
  { week_nr: 6, day_of_week: 1, meal: 'mittag', location: 'city',
    soup: 'Spargelcremesuppe', main1: 'Rindsgeschnetzeltes', side1a: 'Butterspätzle', side1b: 'Buttergemüse',
    main2: 'Gemüsestrudel', side2a: 'Ofengemüse', side2b: '', dessert: 'Obstsalat' },
  { week_nr: 6, day_of_week: 1, meal: 'abend', location: 'city',
    soup: 'Nudelsuppe', main1: 'Hühnerkeulen überbacken', side1a: 'Reis', side1b: 'Buttergemüse',
    main2: 'Eiernockerl', side2a: '', side2b: '', dessert: 'Dessertvariation' },
  { week_nr: 6, day_of_week: 1, meal: 'mittag', location: 'sued',
    soup: 'Spargelcremesuppe', main1: 'Schweinsbraten', side1a: 'Semmelknödel', side1b: 'Sauerkraut',
    main2: 'Kasnudeln', side2a: 'Blattsalat', side2b: '', dessert: 'Obstsalat' },
  { week_nr: 6, day_of_week: 1, meal: 'abend', location: 'sued',
    soup: 'Nudelsuppe', main1: 'Hühnergeschnetzeltes', side1a: 'Kräuterreis', side1b: '',
    main2: 'Spinat-Tortellini', side2a: 'Tomatensauce', side2b: '', dessert: 'Dessertvariation' },

  // --- Dienstag W6 ---
  { week_nr: 6, day_of_week: 2, meal: 'mittag', location: 'city',
    soup: 'Minestrone', main1: 'Lachsfilet', side1a: 'Kräuterreis', side1b: 'Buttergemüse',
    main2: 'Spinatlasagne', side2a: '', side2b: '', dessert: 'Tiramisu' },
  { week_nr: 6, day_of_week: 2, meal: 'abend', location: 'city',
    soup: 'Kürbiscremesuppe', main1: 'Rindsroulade', side1a: 'Polenta', side1b: 'Bratensauce',
    main2: 'Fruchtknödel', side2a: 'Apfelkompott', side2b: '', dessert: 'Powidltascherl' },
  { week_nr: 6, day_of_week: 2, meal: 'mittag', location: 'sued',
    soup: 'Minestrone', main1: 'Karpfen gebacken', side1a: 'Erdäpfelsalat', side1b: '',
    main2: 'Gemüse-Lasagne', side2a: '', side2b: '', dessert: 'Tiramisu' },
  { week_nr: 6, day_of_week: 2, meal: 'abend', location: 'sued',
    soup: 'Kürbiscremesuppe', main1: 'Faschierte Laibchen', side1a: 'Erdäpfelpüree', side1b: '',
    main2: 'Krautfleckerl', side2a: 'Blattsalat', side2b: '', dessert: 'Pudding' },

  // --- Mittwoch W6 ---
  { week_nr: 6, day_of_week: 3, meal: 'mittag', location: 'city',
    soup: 'Karottencremesuppe', main1: 'Kabeljaufilet mit Senfkruste', side1a: 'Erdäpfelpüree', side1b: '',
    main2: 'Gemüselaibchen', side2a: 'Ofengemüse', side2b: '', dessert: 'Panna Cotta' },
  { week_nr: 6, day_of_week: 3, meal: 'abend', location: 'city',
    soup: 'Kartoffelcremesuppe', main1: 'Cevapcici', side1a: 'Djuvec-Reis', side1b: 'Röstzwiebel',
    main2: 'Kaiserschmarrn', side2a: 'Apfelkompott', side2b: '', dessert: 'Salzburger Nockerl' },
  { week_nr: 6, day_of_week: 3, meal: 'mittag', location: 'sued',
    soup: 'Karottencremesuppe', main1: 'Seehecht gebraten', side1a: 'Petersilienerdäpfel', side1b: 'Buttergemüse',
    main2: 'Bolognese vegetarisch', side2a: 'Bandnudeln', side2b: '', dessert: 'Panna Cotta' },
  { week_nr: 6, day_of_week: 3, meal: 'abend', location: 'sued',
    soup: 'Kartoffelcremesuppe', main1: 'Steirisches Wurzelfleisch', side1a: 'Salzerdäpfel', side1b: '',
    main2: 'Tiroler Gröstl vegetarisch', side2a: 'Blattsalat', side2b: '', dessert: 'Dessertvariation' },

  // --- Donnerstag W6 ---
  { week_nr: 6, day_of_week: 4, meal: 'mittag', location: 'city',
    soup: 'Leberknödelsuppe', main1: 'Rahmschnitzel', side1a: 'Butterspätzle', side1b: 'Buttergemüse',
    main2: 'Erdäpfelgulasch', side2a: '', side2b: '', dessert: 'Apfelstrudel' },
  { week_nr: 6, day_of_week: 4, meal: 'abend', location: 'city',
    soup: 'Frittatensuppe', main1: 'Gemüse-Hühnercurry', side1a: 'Kräuterreis', side1b: '',
    main2: 'Gemüse-Couscous', side2a: '', side2b: '', dessert: 'Schokomousse' },
  { week_nr: 6, day_of_week: 4, meal: 'mittag', location: 'sued',
    soup: 'Leberknödelsuppe', main1: 'Paprikahendl', side1a: 'Bandnudeln', side1b: '',
    main2: 'Käsespätzle', side2a: 'Röstzwiebel', side2b: '', dessert: 'Apfelstrudel' },
  { week_nr: 6, day_of_week: 4, meal: 'abend', location: 'sued',
    soup: 'Frittatensuppe', main1: 'Puten-Curry', side1a: 'Kräuterreis', side1b: '',
    main2: 'Kartoffelrösti', side2a: 'Ofengemüse', side2b: '', dessert: 'Schokomousse' },

  // --- Freitag W6 ---
  { week_nr: 6, day_of_week: 5, meal: 'mittag', location: 'city',
    soup: 'Gemüsesuppe', main1: 'Spaghetti Bolognese', side1a: '', side1b: '',
    main2: 'Pasta all\'arrabbiata', side2a: 'Ofengemüse', side2b: '', dessert: 'Buchteln mit Vanillesauce' },
  { week_nr: 6, day_of_week: 5, meal: 'abend', location: 'city',
    soup: 'Backerbsensuppe', main1: 'Faschierte Laibchen', side1a: 'Erdäpfelpüree', side1b: '',
    main2: 'Palatschinken', side2a: '', side2b: '', dessert: 'Obstsalat' },
  { week_nr: 6, day_of_week: 5, meal: 'mittag', location: 'sued',
    soup: 'Gemüsesuppe', main1: 'Cevapcici', side1a: 'Djuvec-Reis', side1b: 'Röstzwiebel',
    main2: 'Spinat-Schafkäse-Strudel', side2a: '', side2b: '', dessert: 'Buchteln mit Vanillesauce' },
  { week_nr: 6, day_of_week: 5, meal: 'abend', location: 'sued',
    soup: 'Backerbsensuppe', main1: 'Hühnerfilet', side1a: 'Reis', side1b: 'Buttergemüse',
    main2: 'Topfenknödel', side2a: 'Apfelkompott', side2b: '', dessert: 'Obstsalat' },

  // --- Samstag W6 ---
  { week_nr: 6, day_of_week: 6, meal: 'mittag', location: 'city',
    soup: 'Brokkolicremesuppe', main1: 'Tafelspitz', side1a: 'Apfelkren', side1b: 'Schnittlauchsauce',
    main2: 'Linsendalgemüse', side2a: 'Reis', side2b: '', dessert: 'Reisauflauf mit Kirschen' },
  { week_nr: 6, day_of_week: 6, meal: 'abend', location: 'city',
    soup: 'Lauchcremesuppe', main1: 'Schweinshaxe', side1a: 'Semmelknödel', side1b: 'Sauerkraut',
    main2: 'Germknödel', side2a: '', side2b: '', dessert: 'Topfencreme mit Beeren' },
  { week_nr: 6, day_of_week: 6, meal: 'mittag', location: 'sued',
    soup: 'Brokkolicremesuppe', main1: 'Schweinefilet', side1a: 'Kartoffelgratin', side1b: 'Buttergemüse',
    main2: 'Gemüsestrudel', side2a: 'Ofengemüse', side2b: '', dessert: 'Reisauflauf mit Kirschen' },
  { week_nr: 6, day_of_week: 6, meal: 'abend', location: 'sued',
    soup: 'Zwiebelsuppe', main1: 'Korma-Hühnerkeule', side1a: 'Erbsenreis', side1b: '',
    main2: 'Gemüse-Couscous', side2a: '', side2b: '', dessert: 'Topfencreme mit Beeren' },

  // --- Sonntag W6 ---
  { week_nr: 6, day_of_week: 0, meal: 'mittag', location: 'city',
    soup: 'Grießnockerlsuppe', main1: 'Zwiebelrostbraten', side1a: 'Bratkartoffeln', side1b: 'Röstzwiebel',
    main2: 'Kasnudeln', side2a: 'Blattsalat', side2b: '', dessert: 'Dessertvariation' },
  { week_nr: 6, day_of_week: 0, meal: 'abend', location: 'city',
    soup: 'Rindsuppe mit Frittaten', main1: 'Wiener Schnitzel', side1a: 'Erdäpfelsalat', side1b: 'Preiselbeeren',
    main2: 'Eiernockerl', side2a: '', side2b: '', dessert: 'Joghurt mit Früchten' },
  { week_nr: 6, day_of_week: 0, meal: 'mittag', location: 'sued',
    soup: 'Grießnockerlsuppe', main1: 'Rindsgulasch', side1a: 'Butterspätzle', side1b: '',
    main2: 'Spinatlasagne', side2a: '', side2b: '', dessert: 'Dessertvariation' },
  { week_nr: 6, day_of_week: 0, meal: 'abend', location: 'sued',
    soup: 'Rindsuppe mit Frittaten', main1: 'Putenschnitzel', side1a: 'Erdäpfelpüree', side1b: 'Preiselbeeren',
    main2: 'Palatschinken', side2a: '', side2b: '', dessert: 'Joghurt mit Früchten' },
];

export function seedDatabase() {
  const db = getDb();
  initializeDatabase();

  // Check if already seeded
  const count = db.prepare('SELECT COUNT(*) as c FROM dishes').get() as { c: number };
  if (count.c > 0) return;

  const insertDish = db.prepare(
    'INSERT INTO dishes (name, category, allergens) VALUES (?, ?, ?)'
  );

  const insertRotation = db.prepare(`
    INSERT OR REPLACE INTO rotation_weeks (week_nr, day_of_week, meal, location, soup_id, main1_id, side1a_id, side1b_id, main2_id, side2a_id, side2b_id, dessert_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const seedAll = db.transaction(() => {
    // Insert dishes
    for (const dish of DISHES) {
      insertDish.run(dish.name, dish.category, dish.allergens);
    }

    // Insert rotation data
    for (const r of ROTATION_DATA) {
      insertRotation.run(
        r.week_nr,
        r.day_of_week,
        r.meal,
        r.location,
        r.soup ? getDishId(db, r.soup) : null,
        r.main1 ? getDishId(db, r.main1) : null,
        r.side1a ? getDishId(db, r.side1a) : null,
        r.side1b ? getDishId(db, r.side1b) : null,
        r.main2 ? getDishId(db, r.main2) : null,
        r.side2a ? getDishId(db, r.side2a) : null,
        r.side2b ? getDishId(db, r.side2b) : null,
        r.dessert ? getDishId(db, r.dessert) : null
      );
    }
  });

  seedAll();
}

export function reseedDatabase() {
  const db = getDb();
  initializeDatabase();
  db.exec('DELETE FROM rotation_weeks');
  db.exec('DELETE FROM weekly_plans');
  db.exec('DELETE FROM dishes');
  // Reset auto-increment
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('dishes','rotation_weeks','weekly_plans')");
  seedDishes(db);
}

function seedDishes(db: ReturnType<typeof getDb>) {
  const insertDish = db.prepare(
    'INSERT INTO dishes (name, category, allergens) VALUES (?, ?, ?)'
  );
  const insertRotation = db.prepare(`
    INSERT OR REPLACE INTO rotation_weeks (week_nr, day_of_week, meal, location, soup_id, main1_id, side1a_id, side1b_id, main2_id, side2a_id, side2b_id, dessert_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const doSeed = db.transaction(() => {
    for (const dish of DISHES) {
      insertDish.run(dish.name, dish.category, dish.allergens);
    }
    for (const r of ROTATION_DATA) {
      insertRotation.run(
        r.week_nr, r.day_of_week, r.meal, r.location,
        r.soup ? getDishId(db, r.soup) : null,
        r.main1 ? getDishId(db, r.main1) : null,
        r.side1a ? getDishId(db, r.side1a) : null,
        r.side1b ? getDishId(db, r.side1b) : null,
        r.main2 ? getDishId(db, r.main2) : null,
        r.side2a ? getDishId(db, r.side2a) : null,
        r.side2b ? getDishId(db, r.side2b) : null,
        r.dessert ? getDishId(db, r.dessert) : null
      );
    }
  });
  doSeed();
}
