import { DEFAULT_CHART_PERIOD_DAYS } from '../constants';

/**
 * Returns the number of days between two dates.
 */
export function daysBetween(start: Date, end: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const startUTC = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUTC = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.floor((endUTC - startUTC) / msPerDay);
}

/**
 * Adds days to a date, returning a new Date.
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Formats a date for display (DD/MM/YYYY).
 */
export function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formats a date for input[type="date"] (YYYY-MM-DD).
 */
export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a date string from an input[type="date"] (YYYY-MM-DD).
 * Returns null if invalid.
 */
export function parseInputDate(value: string): Date | null {
  if (!value) return null;
  
  const parts = value.split('-');
  if (parts.length !== 3) return null;
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
  const day = parseInt(parts[2], 10);
  
  const date = new Date(year, month, day);
  
  // Validate the date is real
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }
  
  return date;
}

/**
 * Gets today's date with time set to midnight.
 */
export function getToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Gets the default end date (today + 1 year).
 */
export function getDefaultEndDate(): Date {
  return addDays(getToday(), DEFAULT_CHART_PERIOD_DAYS);
}

/**
 * Checks if a date is in the past (before today).
 */
export function isDateInPast(date: Date): boolean {
  return date < getToday();
}

/**
 * Checks if a date is valid for a due date (must be in the future).
 */
export function isValidDueDate(date: Date): boolean {
  return date > getToday();
}