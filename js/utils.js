/* ============================================
   FocusClock — Utility Functions
   ============================================ */

/**
 * Generate a UUID v4.
 */
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Format seconds into HH:MM:SS string.
 * @param {number} totalSeconds
 * @returns {string}
 */
function formatTime(totalSeconds) {
  const negative = totalSeconds < 0;
  const abs = Math.abs(Math.floor(totalSeconds));
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  const pad = (n) => String(n).padStart(2, '0');
  const time = `${pad(h)}:${pad(m)}:${pad(s)}`;
  return negative ? `-${time}` : time;
}

/**
 * Format seconds into a human-readable short string.
 * e.g., "2h 30m", "45m", "1h"
 * @param {number} totalSeconds
 * @returns {string}
 */
function formatTimeShort(totalSeconds) {
  const abs = Math.abs(Math.floor(totalSeconds));
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  if (m > 0) return `${m}m`;
  return `${abs}s`;
}

/**
 * Parse a time string "HH:MM" or hours number into seconds.
 * @param {string|number} input
 * @returns {number}
 */
function parseTimeToSeconds(input) {
  if (typeof input === 'number') return input * 3600;
  const parts = String(input).split(':');
  if (parts.length === 2) {
    return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60;
  }
  return parseFloat(input) * 3600;
}

/**
 * Get the current ISO timestamp.
 * @returns {string}
 */
function nowISO() {
  return new Date().toISOString();
}

/**
 * Get the day name from a date string/object.
 * @param {string|Date} date
 * @returns {string} e.g., "Monday"
 */
function getDayName(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

/**
 * Get short day name.
 * @param {string|Date} date
 * @returns {string} e.g., "Mon"
 */
function getDayShort(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

/**
 * Get the hour (0-23) from a date string.
 * @param {string|Date} date
 * @returns {number}
 */
function getHour(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getHours();
}

/**
 * Get date string YYYY-MM-DD from a date.
 * @param {string|Date} date
 * @returns {string}
 */
function toDateKey(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * Get the start of today as Date.
 * @returns {Date}
 */
function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the start of the current week (Monday) as Date.
 * @returns {Date}
 */
function startOfWeek() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Check if two dates are the same calendar day.
 * @param {Date} a
 * @param {Date} b
 * @returns {boolean}
 */
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

/**
 * Calculate percentage, clamped 0-100.
 * @param {number} value
 * @param {number} total
 * @returns {number}
 */
function percentage(value, total) {
  if (total === 0) return 0;
  return Math.min(100, Math.max(0, (value / total) * 100));
}

/**
 * Clamp a number between min and max.
 */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Debounce a function.
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
function debounce(fn, delay = 300) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}
