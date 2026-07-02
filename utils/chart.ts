// Shared helpers for the record-based charts (workout plan details, exercise details).
// These charts plot the latest N "records" (one record = one session) on the X-axis,
// paginating back through history in fixed-size windows — as opposed to the calendar-week
// homepage chart in components/dashboard/WeeklyVolumeChart.tsx.

export const RECORDS_PER_PAGE = 5;

export interface ChartRecord {
  date: Date;
  value: number;
  subtitle?: string; // shown in the tap tooltip below the value (e.g. "100 kg × 8 reps")
}

// Round an axis maximum up to a "nice" round number (1, 2, 5 × 10^n) so the Y-axis
// labels read cleanly. Mirrors the logic used by WeeklyVolumeChart.
export function niceCeil(value: number): number {
  if (value <= 0) return 10;
  const exponent = Math.floor(Math.log10(value));
  const magnitude = Math.pow(10, exponent);
  const fraction = value / magnitude;
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return niceFraction * magnitude;
}

export function formatAxisValue(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k` : String(Math.round(value));
}

export function formatDdMm(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export interface RecordWindow {
  points: ChartRecord[]; // oldest -> newest, for left-to-right display (<= RECORDS_PER_PAGE)
  canGoPrev: boolean; // older records exist beyond this window
  canGoNext: boolean; // newer records exist (offset > 0)
  periodLabel: string;
}

// records must be ordered newest-first. offset 0 = the most recent window.
// Going "prev" moves to older records, "next" back toward the latest.
export function computeRecordWindow(records: ChartRecord[], offset: number): RecordWindow {
  const start = offset * RECORDS_PER_PAGE;
  const slice = records.slice(start, start + RECORDS_PER_PAGE); // newest-first subset
  const points = [...slice].reverse(); // oldest -> newest for display

  const canGoPrev = start + RECORDS_PER_PAGE < records.length;
  const canGoNext = offset > 0;

  let periodLabel: string;
  if (points.length === 0) {
    periodLabel = '—';
  } else if (offset === 0) {
    periodLabel = 'Latest';
  } else if (points.length === 1) {
    periodLabel = formatDdMm(points[0].date);
  } else {
    periodLabel = `${formatDdMm(points[0].date)} – ${formatDdMm(points[points.length - 1].date)}`;
  }

  return { points, canGoPrev, canGoNext, periodLabel };
}
