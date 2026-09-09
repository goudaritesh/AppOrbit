/**
 * Formats a Date object or ISO string into a human-readable format.
 * @param {string|Date} date - Input date
 * @param {object} [options] - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return 'N/A';
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };
  return new Intl.DateTimeFormat('en-US', defaultOptions).format(new Date(date));
};

/**
 * Formats a numeric value into a compact representation (e.g. 1.2k, 2.5M).
 * @param {number} num - Raw number
 * @returns {string} Compact formatted number
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}k`;
  }
  return num.toLocaleString();
};

/**
 * Formats bytes into a human-readable file size string.
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted size (e.g. "24.5 MB")
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};
