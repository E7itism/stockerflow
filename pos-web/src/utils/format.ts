/**
 * Formatting utilities for the POS app
 * WHY: Centralizing formatting prevents inconsistency across receipts,
 * carts, and dashboards (e.g., ₱1,234.50 vs 1234.5)
 */

/** Format number as Philippine Peso */
export function formatPeso(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(num)
}

/** Format ISO date string as readable date + time */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

/** Get today's date as YYYY-MM-DD (for API query params) */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}
