
import type {
  Subject,
  TimetableEntry,
  TimetableSubEntry,
} from "@/lib/store/timetable-store";

// Interface for day display cells
export interface DayDisplayCell {
  timeIndex: number;
  span: number;
  subjectToDisplay: Subject | null;
  subEntryToDisplay: TimetableSubEntry | undefined;
  currentFullEntry: TimetableEntry | undefined;
  isMerged: boolean;
}

// Utility functions
export function parseTimeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(":").map(Number);
  return hours * 60 + minutes;
}

export const ensureArray = (value: string | string[] | undefined): string[] => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

// Day names constants
export const dayNames = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];

export function getDisplayDayNames(showSaturday: boolean): string[] {
  return showSaturday ? [...dayNames, "Samedi"] : dayNames;
}

export function getNumberOfDays(showSaturday: boolean): number {
  return showSaturday ? 6 : 5;
}