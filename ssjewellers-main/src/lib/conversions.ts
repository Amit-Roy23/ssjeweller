/**
 * S.S JEWELLERY ERP — Precision Conversion & Formatting Utilities
 * 
 * Rules:
 * 1. Internal storage:
 *    - Money is always stored in integer Paise (1 INR = 100 Paise).
 *    - Weights (Gold, Silver, Platinum, Wastage) are always stored in integer Milligrams (1 gram = 1000 mg).
 *    - Rates & percentages are stored in basis points (1% = 100 bps) or standard fixed-scale representations.
 * 2. Floating-point arithmetic is strictly prohibited for monetary/weight calculations in server/services.
 * 3. Conversions happen solely at UI/API boundary edges.
 */

// ============================================================================
// Money Conversions (INR <-> Paise)
// ============================================================================

/**
 * Converts INR (Rupees, e.g. 1500.50) to integer Paise (e.g. 150050n).
 */
export function rupeesToPaise(rupees: number | string | bigint): bigint {
  if (typeof rupees === 'bigint') return rupees * 100n
  const num = typeof rupees === 'string' ? parseFloat(rupees) : rupees
  if (isNaN(num) || !isFinite(num)) return 0n
  // Round to nearest integer paise to eliminate JS float jitter (e.g., 0.1 + 0.2 = 0.30000000000000004)
  return BigInt(Math.round(num * 100))
}

/**
 * Converts integer Paise (e.g. 150050n) to INR decimal number (e.g. 1500.50).
 */
export function paiseToRupees(paise: bigint | number | null | undefined): number {
  if (paise == null) return 0
  const p = typeof paise === 'bigint' ? Number(paise) : paise
  return p / 100
}

/**
 * Formats integer Paise as a localized currency string (e.g. "₹1,500.50").
 */
export function formatPaise(paise: bigint | number | null | undefined, currency = '₹'): string {
  const rupees = paiseToRupees(paise)
  if (!Number.isFinite(rupees)) return `${currency}0.00`
  const fixed = Math.round(rupees * 100) / 100
  const [whole, frac] = fixed.toFixed(2).split('.')
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${currency}${withCommas}.${frac}`
}

/**
 * Formats integer Paise in compact Indian denomination (e.g. "₹1.50L", "₹2.40k", "₹1.20Cr").
 */
export function formatPaiseCompact(paise: bigint | number | null | undefined, currency = '₹'): string {
  const rupees = paiseToRupees(paise)
  if (rupees >= 10000000) return `${currency}${(rupees / 10000000).toFixed(2)}Cr`
  if (rupees >= 100000) return `${currency}${(rupees / 100000).toFixed(2)}L`
  if (rupees >= 1000) return `${currency}${(rupees / 1000).toFixed(1)}k`
  return `${currency}${rupees.toFixed(0)}`
}

// ============================================================================
// Weight Conversions (Grams <-> Milligrams)
// ============================================================================

/**
 * Converts Grams (e.g. 22.500g) to integer Milligrams (e.g. 22500n).
 */
export function gramsToMg(grams: number | string | bigint): bigint {
  if (typeof grams === 'bigint') return grams * 1000n
  const num = typeof grams === 'string' ? parseFloat(grams) : grams
  if (isNaN(num) || !isFinite(num)) return 0n
  return BigInt(Math.round(num * 1000))
}

/**
 * Converts integer Milligrams (e.g. 22500n) to Grams decimal (e.g. 22.5).
 */
export function mgToGrams(mg: bigint | number | null | undefined): number {
  if (mg == null) return 0
  const m = typeof mg === 'bigint' ? Number(mg) : mg
  return m / 1000
}

/**
 * Formats integer Milligrams as a clean weight string with 3 decimal precision (e.g. "22.500g").
 */
export function formatMg(mg: bigint | number | null | undefined, decimals = 3): string {
  const g = mgToGrams(mg)
  return `${g.toFixed(decimals)}g`
}

/**
 * Formats decimal grams with specified decimal places (e.g. "22.500 g").
 */
export function formatGrams(g: number | null | undefined, decimals = 3): string {
  if (g == null || isNaN(g)) return `0.${'0'.repeat(decimals)} g`
  return `${g.toFixed(decimals)} g`
}

// ============================================================================
// Stone Weight Conversions (Carats <-> Milligrams)
// 1 Carat = 200 Milligrams = 0.200 Grams
// ============================================================================

/**
 * Converts Carats (e.g. 0.35 ct) to integer Milligrams (e.g. 70 mg).
 */
export function caratsToMg(carats: number | string): bigint {
  const num = typeof carats === 'string' ? parseFloat(carats) : carats
  if (isNaN(num) || !isFinite(num)) return 0n
  return BigInt(Math.round(num * 200))
}

/**
 * Converts integer Milligrams (e.g. 70 mg) to Carats (e.g. 0.35 ct).
 */
export function mgToCarats(mg: bigint | number | null | undefined): number {
  if (mg == null) return 0
  const m = typeof mg === 'bigint' ? Number(mg) : mg
  return m / 200
}

// ============================================================================
// Basis Points Conversions (Percentage <-> BPS)
// 1% = 100 BPS (Basis Points) | e.g. 3% GST = 300 BPS | 91.6% purity = 9160 BPS
// ============================================================================

/**
 * Converts a percentage (e.g. 3 for 3%, 91.6 for 91.6%) to integer Basis Points (300, 9160).
 */
export function percentToBps(percent: number | string): number {
  const num = typeof percent === 'string' ? parseFloat(percent) : percent
  if (isNaN(num) || !isFinite(num)) return 0
  return Math.round(num * 100)
}

/**
 * Converts integer Basis Points (e.g. 300, 9160) to a percentage (e.g. 3.0, 91.6).
 */
export function bpsToPercent(bps: number | null | undefined): number {
  if (bps == null) return 0
  return bps / 100
}
