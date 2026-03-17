// ─── VIN Validation & Decoding ───────────────────────────────────────────────

const VIN_LENGTH = 17;
const FORBIDDEN_CHARS = /[IOQ]/i;
const ALPHANUMERIC = /^[A-Z0-9]+$/i;

// Transliteration map for check digit calculation (ISO 3779)
const TRANSLITERATION: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
};

const POSITION_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

// Regions that mandate check digit at position 9 (mod-11)
const CHECK_DIGIT_PREFIXES = new Set([
  "1", "4", "5",  // USA
  "2",             // Canada
  "3",             // Mexico
  "L",             // China
]);

function requiresCheckDigit(vin: string): boolean {
  return CHECK_DIGIT_PREFIXES.has(vin[0].toUpperCase());
}

function charValue(c: string): number {
  const n = parseInt(c, 10);
  if (!isNaN(n)) return n;
  return TRANSLITERATION[c.toUpperCase()] ?? 0;
}

function computeCheckDigit(vin: string): string {
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += charValue(vin[i]) * POSITION_WEIGHTS[i];
  }
  const remainder = sum % 11;
  return remainder === 10 ? "X" : String(remainder);
}

export interface VinValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a VIN string (ISO 3779).
 * Returns { valid: true } or { valid: false, error: "..." }.
 */
export function validateVin(vin: string): VinValidationResult {
  if (!vin || vin.length !== VIN_LENGTH) {
    return { valid: false, error: "El VIN debe tener 17 caracteres." };
  }

  if (!ALPHANUMERIC.test(vin)) {
    return { valid: false, error: "El VIN solo puede contener letras y números." };
  }

  if (FORBIDDEN_CHARS.test(vin)) {
    return { valid: false, error: "El VIN no puede contener las letras I, O o Q." };
  }

  if (requiresCheckDigit(vin)) {
    const expected = computeCheckDigit(vin);
    if (vin[8].toUpperCase() !== expected) {
      return { valid: false, error: "El dígito verificador del VIN es inválido." };
    }
  }

  return { valid: true };
}

/**
 * Sanitize VIN input: uppercase, strip spaces.
 */
export function sanitizeVin(input: string): string {
  return input.replace(/\s/g, "").toUpperCase();
}

// ─── auto.dev VIN Decode API ─────────────────────────────────────────────────

export interface VinDecodeResult {
  make: string | null;
  model: string | null;
  year: number | null;
  trim: string | null;
}

const AUTO_DEV_API_URL = "https://api.auto.dev/vin";

/**
 * Decode a VIN using the auto.dev VIN Decode API.
 * Returns decoded data on success, null on failure.
 * This is a paid API — only call when the vehicle is not already in the DB.
 */
export async function decodeVin(vin: string): Promise<VinDecodeResult | null> {
  const apiKey = process.env.AUTO_DEV_API_KEY;
  if (!apiKey) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${AUTO_DEV_API_URL}/${vin}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const data = await res.json();

    // Root fields take priority, fall back to vehicle.*
    const rawMake = data.make || data.vehicle?.make || null;
    const make = rawMake || data.type || null; // type as last resort for make
    const model = data.model || data.vehicle?.model || null;
    const rawYear = data.year ?? data.vehicle?.year ?? null;
    const year = Array.isArray(rawYear) ? rawYear[0] : rawYear;
    const trim = data.trim || null; // trim only at root (not in vehicle)

    return { make, model, year: typeof year === "number" ? year : null, trim };
  } catch {
    return null;
  }
}
