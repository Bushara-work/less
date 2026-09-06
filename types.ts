export interface AttendanceRow {
  [key: string]: string;
}

export interface DuplicateGroup {
  id: string;
  fingerprint: string;
  originalIndices: number[]; // 0-based indices in masterData
  sampleRow: AttendanceRow;
  approved: boolean;
  ignored: boolean;
}

export type TimeMode = '12h' | '24h';
export type DragOrientation = 'vertical' | 'horizontal'; // vertical = columns (||), horizontal = rows (═)

export interface SortConfig {
  nameOrder: 'asc' | 'desc';
  dateOrder: 'asc' | 'desc';
  isNamePriorityPrimary: boolean;
  isRankLocked: boolean;
}

export interface FilterConfig {
  participantName: string;
  meetingCode: string;
  minDuration: string;
  maxDuration: string;
  startDate: string;
  endDate: string;
  isStartDateInclusive: boolean;
  isEndDateInclusive: boolean;
  sno: string;
  startedTime: string;
  joinedTime: string;
  stoppedTime: string;
}

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  type: 'column' | 'row' | null;
  targetColumnKey?: string;
  targetRowIndex?: number;
}
