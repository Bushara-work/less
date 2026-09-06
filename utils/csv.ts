import { AttendanceRow, DuplicateGroup } from '../types';

export const MASTER_HEADERS = [
  "SNo",
  "Participant Name",
  "Attendance Started at",
  "Joined at(beta)",
  "Attendance Stopped at",
  "Attended Duration",
  "Meeting code",
  "Class Date"
];

export const SYSTEM_PROTECTED_HEADERS = [...MASTER_HEADERS];

export function getExcelColumnLetterLabel(index: number): string {
  let label = '';
  let i = index;
  while (i >= 0) {
    label = String.fromCharCode((i % 26) + 65) + label;
    i = Math.floor(i / 26) - 1;
  }
  return label;
}

export function extractDateFromFilename(filename: string): string {
  const match = filename.match(/\(([^)]+)\)/);
  if (match) {
    let rawDate = match[1].trim().replace(/\./g, '-');
    const parts = rawDate.split('-');
    if (parts.length === 3) {
      const day = parts[0].trim();
      let month = parts[1].trim();
      const year = parts[2].trim();
      
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const numericMonth = parseInt(month, 10);
      if (!isNaN(numericMonth) && numericMonth >= 1 && numericMonth <= 12) {
        month = monthNames[numericMonth - 1];
      } else if (month.length >= 3) {
        month = month.substring(0, 3);
        month = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
      }
      return `${day}-${month}-${year}`;
    }
    return rawDate;
  }

  // Fallback: look for patterns like 12-May-2024 or 2024-05-12 in filename
  const generalDateMatch = filename.match(/(\d{1,2})[-_.](\w{3,9}|\d{1,2})[-_.](\d{2,4})/);
  if (generalDateMatch) {
    return `${generalDateMatch[1]}-${generalDateMatch[2]}-${generalDateMatch[3]}`;
  }

  return "Unknown Date";
}

export function parseCSVLine(text: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  const cleanText = text.replace(/\r$/, '');

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    if (char === '"') {
      if (inQuotes && cleanText[i + 1] === '"') {
        current += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseCustomDate(dateStr: string | undefined): Date {
  if (!dateStr || dateStr === "Unknown Date") return new Date(0);
  const cleanStr = dateStr.replace(/\./g, '-').toLowerCase();
  const parts = cleanStr.split('-');
  if (parts.length !== 3) {
    const parsed = Date.parse(dateStr);
    return isNaN(parsed) ? new Date(0) : new Date(parsed);
  }

  const day = parseInt(parts[0], 10);
  const monthStr = parts[1].substring(0, 3);
  const year = parseInt(parts[2], 10);

  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const monthIndex = months.indexOf(monthStr);

  if (monthIndex !== -1) {
    const fullYear = year < 100 ? 2000 + year : year;
    return new Date(fullYear, monthIndex, day);
  }

  const numericMonth = parseInt(parts[1], 10);
  if (!isNaN(numericMonth)) {
    const fullYear = year < 100 ? 2000 + year : year;
    return new Date(fullYear, numericMonth - 1, day);
  }

  return new Date(0);
}

export function parseDurationToMinutes(durStr: string | undefined): number {
  if (!durStr) return 0;
  const clean = durStr.toLowerCase().replace(/[^0-9\shm:]/g, '').trim();
  if (!clean) return 0;

  if (clean.includes(':')) {
    const parts = clean.split(':').map(p => parseInt(p, 10) || 0);
    if (parts.length === 3) return parts[0] * 60 + parts[1] + Math.round(parts[2] / 60);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
  }

  if (clean.includes('h') || clean.includes('m')) {
    let totalMin = 0;
    const hrMatch = clean.match(/(\d+)\s*h/);
    const minMatch = clean.match(/(\d+)\s*m/);
    if (hrMatch) totalMin += parseInt(hrMatch[1], 10) * 60;
    if (minMatch) totalMin += parseInt(minMatch[1], 10);
    return totalMin;
  }

  const parsed = parseInt(clean, 10);
  return isNaN(parsed) ? 0 : parsed;
}

export function convertTimeStringSyntax(timeStr: string | undefined): string {
  if (!timeStr) return "";
  const clean = timeStr.trim().toUpperCase();

  // 12-hour with AM/PM -> 24-hour military
  const ampmMatch = clean.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/);
  if (ampmMatch) {
    let hrs = parseInt(ampmMatch[1], 10);
    const mins = ampmMatch[2];
    const secs = ampmMatch[3] ? `:${ampmMatch[3]}` : "";
    const period = ampmMatch[4];

    if (period === "PM" && hrs < 12) hrs += 12;
    if (period === "AM" && hrs === 12) hrs = 0;
    return `${String(hrs).padStart(2, '0')}:${mins}${secs}`;
  }

  // 24-hour military -> 12-hour AM/PM
  const militaryMatch = clean.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (militaryMatch) {
    let hrs = parseInt(militaryMatch[1], 10);
    const mins = militaryMatch[2];
    const secs = militaryMatch[3] ? `:${militaryMatch[3]}` : "";
    let period = "AM";

    if (hrs >= 12) {
      period = "PM";
      if (hrs > 12) hrs -= 12;
    }
    if (hrs === 0) hrs = 12;
    return `${hrs}:${mins}${secs} ${period}`;
  }

  return timeStr;
}

export function exportToCSV(data: AttendanceRow[], headers: string[]): void {
  if (data.length === 0) return;

  let csvContent = headers.join(",") + "\n";
  const dynamicSpacer = ",".repeat(Math.max(0, headers.length - 1));
  csvContent += dynamicSpacer + "\n";

  data.forEach(row => {
    const rowLine = headers.map(header => {
      let cellValue = row[header] ?? '';
      if (cellValue.includes(',') || cellValue.includes('"') || cellValue.includes('\n')) {
        cellValue = `"${cellValue.replace(/"/g, '""')}"`;
      }
      return cellValue;
    }).join(",");
    csvContent += rowLine + "\n";
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "combined_attendance_report.csv");
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Identify sets of duplicated rows where every active column has the exact same value.
 */
export function findDuplicateGroups(data: AttendanceRow[], headers: string[]): DuplicateGroup[] {
  const map: { [key: string]: number[] } = {};

  data.forEach((row, idx) => {
    const fingerprint = headers.map(h => String(row[h] || '').trim().toLowerCase()).join('|||');
    if (!map[fingerprint]) {
      map[fingerprint] = [];
    }
    map[fingerprint].push(idx);
  });

  const groups: DuplicateGroup[] = [];
  let groupCounter = 1;

  for (const [fingerprint, indices] of Object.entries(map)) {
    if (indices.length > 1) {
      const sampleRow = { ...data[indices[0]] };
      groups.push({
        id: `dup-group-${groupCounter++}`,
        fingerprint,
        originalIndices: indices,
        sampleRow,
        approved: false,
        ignored: false,
      });
    }
  }

  return groups;
}
