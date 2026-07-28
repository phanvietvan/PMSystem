/** Vietnam (UTC+7) — never use toISOString() for calendar dates. */

export const VN_TZ = 'Asia/Ho_Chi_Minh';

/** Display timestamp in vi-VN + Asia/Ho_Chi_Minh. */
export function formatVnDateTime(
  value?: string | number | Date | null,
  options?: Intl.DateTimeFormatOptions
): string {
  if (value == null || value === '') return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('vi-VN', {
    timeZone: VN_TZ,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  });
}
