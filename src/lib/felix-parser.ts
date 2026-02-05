/**
 * Felix Pensionsliste parser.
 * Extracts guest counts from OCR text or PDF text.
 */

export interface DayCount {
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
  confidence: number; // 0-1
}

export interface FelixResult {
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

/** OCR often misreads day abbreviations */
const DAY_OCR_FIXES: Record<string, string> = {
  er: 'Fr',  // "Er" -> Freitag
  oi: 'Di',  // "Oi" -> Dienstag
  oo: 'Do',  // "Oo" -> Donnerstag
  '0i': 'Di',  // "0i" -> Dienstag (zero instead of D)
  '0o': 'Do',  // "0o" -> Donnerstag
};

/** Common OCR garbage patterns from document borders/watermarks */
const GARBAGE_PATTERNS = [
  /^[A-Z]{2,6}$/, // Short uppercase words like "BE", "FEN", "BENCENE"
  /^[a-z]{2,4}$/,  // Short lowercase words
  /FORD|BABE|SWEET|VULCE|BORN|DERN?/i,
  /^[.,\-_|]+$/,  // Pure punctuation
  /^N$/i, /^a$/i, /^S$/i, // Single letters
  /Seite \d/i,  // Page markers
  /\.rpt$/i,  // Report file extensions
  /Hotel.*Report/i,
];

/**
 * Fix common OCR errors, but ONLY in tokens that already look mostly numeric.
 * A token like "4l" -> "41", but a standalone "a" stays "a".
 */
function fixOcrToken(token: string): string {
  // Only fix tokens that are at least 50% digits already, or 1-char tokens next to digits
  const digitCount = (token.match(/\d/g) || []).length;
  if (digitCount === 0 && token.length > 1) return token; // purely alphabetic multi-char -> skip

  return token
    .replace(/[oO]/g, '0')
    .replace(/[lI]/g, '1')
    .replace(/[Bb]/g, '8')
    .replace(/[Zz]/g, '2');
}

/** Extract a date from a line, supporting DD.MM.YY, DD.MM.YYYY, DD/MM/YY */
function extractDate(line: string): string | null {
  const m = line.match(/(\d{1,2})[./](\d{1,2})[./](\d{2,4})/);
  if (!m) return null;
  const dd = m[1].padStart(2, '0');
  const mm = m[2].padStart(2, '0');
  const yy = m[3].length === 2 ? m[3] : m[3].slice(2);
  return `${dd}.${mm}.${yy}`;
}

/** Detect day name from line, including OCR error correction */
function extractDay(line: string): string {
  const lower = line.toLowerCase();

  // First try exact matches
  for (const [key, abbr] of Object.entries(DAY_ABBREVS)) {
    if (lower.includes(key)) return abbr;
  }

  // Then try OCR-corrected matches: look for 2-letter codes near the date
  // Pattern: look for isolated 2-letter token that could be a day abbreviation
  const tokens = line.split(/[\s|.,]+/).filter(Boolean);
  for (const token of tokens) {
    const t = token.toLowerCase().replace(/[|]/g, '');
    if (t.length === 2) {
      const fix = DAY_OCR_FIXES[t];
      if (fix) return fix;
    }
  }

  return '';
}

/**
 * Check if a token is garbage (OCR noise from borders/watermarks)
 */
function isGarbageToken(token: string): boolean {
  for (const pattern of GARBAGE_PATTERNS) {
    if (pattern.test(token)) return true;
  }
  return false;
}

/**
 * Extract numbers from a line, skipping date-embedded digits.
 * Strips pipe characters (table separators) and isolated single letters.
 */
function extractNumbers(line: string): number[] {
  // 1. Remove date pattern
  let cleaned = line.replace(/\d{1,2}[./]\d{1,2}[./]\d{2,4}/, '   ');

  // 2. Remove pipe characters (table column separators, NOT digit 1)
  cleaned = cleaned.replace(/\|/g, ' ');

  // 3. Remove day names and "Ges." labels
  for (const key of Object.keys(DAY_ABBREVS)) {
    cleaned = cleaned.replace(new RegExp(key, 'gi'), '   ');
  }
  // Also remove OCR day variants
  for (const key of Object.keys(DAY_OCR_FIXES)) {
    cleaned = cleaned.replace(new RegExp(`\\b${key}\\b`, 'gi'), '   ');
  }
  cleaned = cleaned.replace(/ges(?:amt)?\.?/gi, '   ');

  // 4. Remove garbage sequences like "KO 3 BE" - number surrounded by uppercase
  cleaned = cleaned.replace(/[A-Z]{2,}\s+\d+\s+[A-Z]{2,}/g, '   ');

  // 5. Split into tokens and process each
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  const numbers: number[] = [];

  for (const token of tokens) {
    // Skip garbage tokens (OCR noise)
    if (isGarbageToken(token)) continue;

    // Skip purely alphabetic tokens (noise like "BENCENE", "FORD", etc.)
    if (/^[a-zA-ZÄÖÜäöüß]+$/.test(token)) continue;

    // Skip single non-digit characters
    if (token.length === 1 && !/\d/.test(token)) continue;

    // Skip tokens that look like dots or other punctuation
    if (/^[.,\-_]+$/.test(token)) continue;

    // Apply OCR fixes to tokens that contain some digits
    const fixed = fixOcrToken(token);

    // Extract the number if the fixed token is numeric
    const num = parseInt(fixed, 10);
    if (!isNaN(num) && num >= 0) {
      numbers.push(num);
    }
  }

  return numbers;
}

/**
 * Try to find header line and determine column positions.
 * Returns column count if header found.
 */
function detectHeaderColumns(lines: string[]): number {
  for (const line of lines) {
    const lower = line.toLowerCase();
    const hasGesamt = lower.includes('ges');
    const hasFrueh = lower.includes('fr') && (lower.includes('hst') || lower.includes('üh'));
    const hasMittag = lower.includes('mittag');
    const hasAbend = lower.includes('abend');
    if ((hasGesamt ? 1 : 0) + (hasFrueh ? 1 : 0) + (hasMittag ? 1 : 0) + (hasAbend ? 1 : 0) >= 2) {
      let cols = 0;
      if (hasGesamt) cols++;
      if (hasFrueh) cols++;
      if (lower.includes('kp') || lower.includes('kaffeepause')) cols += 2;
      if (hasMittag) cols++;
      if (hasAbend) cols += 2;
      return Math.max(cols, 7);
    }
  }
  return 7;
}

/** Compute confidence score for a parsed day row */
function computeConfidence(day: Partial<DayCount>, hasDate: boolean, hasDay: boolean, numCount: number): number {
  let score = 0;

  if (hasDate) score += 0.3;
  if (hasDay) score += 0.15;

  if (numCount >= 5 && numCount <= 7) score += 0.25;
  else if (numCount >= 3) score += 0.15;
  else if (numCount >= 2) score += 0.05;

  // Plausibility checks
  if (day.gesamtPax && day.gesamtPax > 1) {
    if (day.mittag !== undefined && day.gesamtPax >= day.mittag) score += 0.1;
    if (day.abendGesamt !== undefined && day.gesamtPax >= day.abendGesamt) score += 0.1;
  }

  const vals = [day.gesamtPax, day.fruehstueck, day.mittag, day.abendE, day.abendK].filter(v => v !== undefined);
  if (vals.length > 0 && vals.every(v => v! >= 0 && v! <= 500)) score += 0.1;

  return Math.min(1, score);
}

/**
 * Assign numbers to Felix columns.
 * Handles 2-7+ numbers by detecting which columns are present.
 */
function assignColumns(nums: number[]): Omit<DayCount, 'date' | 'day' | 'confidence'> {
  // 7+ numbers: full set
  // Gesamt | Fruehstueck | KP Vorm | Mittag | KP Nach | Abend E | Abend K
  if (nums.length >= 7) {
    return {
      gesamtPax: nums[0],
      fruehstueck: nums[1],
      kpVorm: nums[2],
      mittag: nums[3],
      kpNach: nums[4],
      abendE: nums[5],
      abendK: nums[6],
      abendGesamt: nums[5] + nums[6],
    };
  }

  // 6 numbers: likely missing AbendE (it's often 0/empty)
  if (nums.length === 6) {
    return {
      gesamtPax: nums[0],
      fruehstueck: nums[1],
      kpVorm: nums[2],
      mittag: nums[3],
      kpNach: nums[4],
      abendE: 0,
      abendK: nums[5],
      abendGesamt: nums[5],
    };
  }

  // 5 numbers: missing both KP columns
  if (nums.length === 5) {
    return {
      gesamtPax: nums[0],
      fruehstueck: nums[1],
      kpVorm: 0,
      mittag: nums[2],
      kpNach: 0,
      abendE: nums[3],
      abendK: nums[4],
      abendGesamt: nums[3] + nums[4],
    };
  }

  // 4 numbers: Gesamt, Fruehstueck, Mittag, Abend
  if (nums.length === 4) {
    return {
      gesamtPax: nums[0],
      fruehstueck: nums[1],
      kpVorm: 0,
      mittag: nums[2],
      kpNach: 0,
      abendE: nums[3],
      abendK: 0,
      abendGesamt: nums[3],
    };
  }

  // 3 numbers: Gesamt, Fruehstueck/Mittag, Abend
  if (nums.length === 3) {
    return {
      gesamtPax: nums[0],
      fruehstueck: nums[1],
      kpVorm: 0,
      mittag: nums[2],
      kpNach: 0,
      abendE: 0,
      abendK: 0,
      abendGesamt: 0,
    };
  }

  // 2 numbers: Gesamt + one other
  return {
    gesamtPax: nums[0] || 0,
    fruehstueck: nums[1] || 0,
    kpVorm: 0,
    mittag: 0,
    kpNach: 0,
    abendE: 0,
    abendK: 0,
    abendGesamt: 0,
  };
}

/**
 * Check if a line looks like a valid data row (has date + "Ges." pattern)
 * vs garbage/booking notes/other text
 */
function isValidDataLine(line: string): boolean {
  const lower = line.toLowerCase();

  // Must have "Ges." or "Gesamt" to be a data line
  if (!lower.includes('ges')) return false;

  // Skip booking notes (contain specific keywords)
  if (lower.includes('vegan') || lower.includes('vegetarisch')) return false;
  if (lower.includes('universität') || lower.includes('gymnasium')) return false;
  if (lower.includes('bitte') || lower.includes('verpflegung')) return false;
  if (lower.includes('sem ') || lower.includes('gross') || lower.includes('hinrichs')) return false;

  // Skip page footers/headers
  if (lower.includes('seite') || lower.includes('.rpt') || lower.includes('report')) return false;
  if (lower.includes('pensionsliste') && lower.includes('von')) return false;

  return true;
}

/**
 * Pre-process raw OCR text to clean up common issues
 * IMPORTANT: Don't merge lines - process line by line
 */
function preprocessOcrText(text: string): string {
  // Process each line separately to avoid merging
  return text.split('\n').map(line => {
    let cleaned = line;

    // Remove common garbage patterns that span multiple characters (within the line only)
    cleaned = cleaned.replace(/[A-Z]{3,}(?:[ \t]+[A-Z]{2,})+/g, ' '); // Sequences like "BE FEN SE"
    cleaned = cleaned.replace(/\b[A-Z]{2}[ \t]+[A-Z]{2}[ \t]+[A-Z]{2}\b/g, ' '); // "BE EN SE"

    // Clean up multiple spaces (not newlines)
    cleaned = cleaned.replace(/[ \t]{3,}/g, '  ');

    return cleaned;
  }).join('\n');
}

/** Main parser: converts Felix OCR/PDF text to structured data */
export function parseFelixText(text: string): FelixResult {
  // Pre-process the text to remove obvious garbage
  const processedText = preprocessOcrText(text);
  const lines = processedText.split('\n').map(l => l.trim()).filter(Boolean);
  const days: DayCount[] = [];

  detectHeaderColumns(lines);

  // Find reference line with most numbers (to calibrate expected count)
  let refLineNumCount = 0;
  for (const line of lines) {
    const date = extractDate(line);
    if (!date) continue;
    if (!isValidDataLine(line)) continue;
    const nums = extractNumbers(line);
    if (nums.length > refLineNumCount) {
      refLineNumCount = nums.length;
    }
  }

  for (const line of lines) {
    const date = extractDate(line);
    if (!date) continue;

    // Skip lines that are clearly not data rows
    if (!isValidDataLine(line)) continue;

    // Skip header/timestamp lines with month names
    if (/\b(jan|feb|mär|apr|mai|jun|jul|aug|sep|okt|nov|dez)\b/i.test(line) &&
        line.toLowerCase().includes('pensionsliste')) continue;

    const nums = extractNumbers(line);
    const dayName = extractDay(line);

    // Need at least 2 numbers to be a valid data row
    if (nums.length < 2) continue;

    const columns = assignColumns(nums);
    const hasDay = dayName !== '';
    const confidence = computeConfidence(
      { ...columns },
      true,
      hasDay,
      nums.length,
    );

    days.push({
      date,
      day: dayName,
      ...columns,
      confidence,
    });
  }

  // If no days found, try a more lenient approach
  if (days.length === 0) {
    for (const line of lines) {
      const lower = line.toLowerCase();
      const isGesLine = lower.includes('ges') || lower.includes('total');
      if (!isGesLine) continue;

      const nums = extractNumbers(line);
      if (nums.length < 2) continue;

      const columns = assignColumns(nums);
      days.push({
        date: '',
        day: '',
        ...columns,
        confidence: 0.2,
      });
    }
  }

  // Sort by date (chronological)
  if (days.length > 1) {
    days.sort((a, b) => {
      // Parse DD.MM.YY to comparable value
      const parseDate = (d: string) => {
        if (!d) return 99999999;
        const [dd, mm, yy] = d.split('.').map(Number);
        return (2000 + yy) * 10000 + mm * 100 + dd;
      };
      return parseDate(a.date) - parseDate(b.date);
    });
  }

  // Auto-detect hotel
  let hotel = '';
  const fullText = text.toLowerCase();
  if (fullText.includes('süd') || fullText.includes('sud') || fullText.includes('sued')) {
    hotel = 'sued';
  } else if (fullText.includes('city')) {
    hotel = 'city';
  }

  // Auto-detect date range
  let zeitraum = '';
  const zeitraumMatch = text.match(/von\s+(\d{1,2}\.\d{1,2}\.\d{2,4})\s+bis\s+(\d{1,2}\.\d{1,2}\.\d{2,4})/i);
  if (zeitraumMatch) {
    zeitraum = `${zeitraumMatch[1]} – ${zeitraumMatch[2]}`;
  }

  return { hotel, zeitraum, days, rawText: text };
}

/** Confidence level for UI display */
export function confidenceLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 0.7) return 'high';
  if (score >= 0.4) return 'medium';
  return 'low';
}

export const CONFIDENCE_COLORS = {
  high: 'bg-green-100 text-green-800 border-green-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  low: 'bg-red-100 text-red-800 border-red-300',
} as const;

export const CONFIDENCE_DOT = {
  high: 'bg-green-500',
  medium: 'bg-yellow-500',
  low: 'bg-red-500',
} as const;
