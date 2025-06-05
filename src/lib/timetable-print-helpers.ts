import type {
  Subject,
  TimeSlot,
  TimetableEntry,
  TimetableSubEntry,
  WeekDesignation,
} from "@/store/timetable-store";
import { useCallback, useMemo } from "react";
import {
  DayDisplayCell,
  getDisplayDayNames,
  getNumberOfDays,
  parseTimeToMinutes,
} from "./timetable-print-utils";

interface UseTimetablePrintHelpersProps {
  timeSlots: TimeSlot[];
  entries: TimetableEntry[];
  subjects: Subject[];
  showSaturday: boolean;
  currentWeekType: WeekDesignation;
}

export function useTimetablePrintHelpers({
  timeSlots,
  entries,
  subjects,
  showSaturday,
  currentWeekType,
}: UseTimetablePrintHelpersProps) {
  const timeSlotDurations = useMemo(() => {
    return timeSlots.map((slot) => {
      const startTime = parseTimeToMinutes(slot.start);
      const endTime = parseTimeToMinutes(slot.end);
      return endTime - startTime;
    });
  }, [timeSlots]);

  const totalDayMinutes = useMemo(() => {
    return timeSlotDurations.reduce((sum, duration) => sum + duration, 0);
  }, [timeSlotDurations]);

  const findEntryForSlotCb = useCallback(
    (day: number, timeSlotIndex: number): TimetableEntry | undefined => {
      return entries.find(
        (e) => e.day === day && e.timeSlotIndex === timeSlotIndex
      );
    },
    [entries]
  );

  const findSubjectCb = useCallback(
    (subjectId: string): Subject | undefined => {
      return subjects.find((subject) => subject.id === subjectId);
    },
    [subjects]
  );

  const getSubEntryForWeek = useCallback(
    (
      entry: TimetableEntry | undefined,
      week: WeekDesignation
    ): TimetableSubEntry | undefined => {
      if (!entry) return undefined;
      const weekKey = `week${week.toUpperCase()}` as keyof Pick<
        TimetableEntry,
        "weekA" | "weekB" | "weekC"
      >;
      return entry[weekKey];
    },
    []
  );

  const displayDayNames = getDisplayDayNames(showSaturday);
  const numberOfDays = getNumberOfDays(showSaturday);

  const gridTemplateRowsValue = useMemo(() => {
    if (timeSlots.length === 0) {
      return "auto";
    }
    if (totalDayMinutes === 0) {
      return `auto repeat(${timeSlots.length}, minmax(1px, 1fr))`;
    }
    const rowFractions = timeSlotDurations
      .map((duration) => {
        const percentage = (duration / totalDayMinutes) * 100;
        return `${Math.max(percentage, 0.01)}fr`;
      })
      .join(" ");
    return `auto ${rowFractions}`;
  }, [timeSlots, timeSlotDurations, totalDayMinutes]);

  const getProcessedDays = useMemo(() => {
    return Array.from({ length: numberOfDays }).map((_, dayIndex) => {
      const displayCells: DayDisplayCell[] = [];
      let i = 0;
      while (i < timeSlots.length) {
        const firstSlotEntry = findEntryForSlotCb(dayIndex, i);

        const getEffectiveSubEntry = (entry?: TimetableEntry) =>
          getSubEntryForWeek(entry, currentWeekType) ||
          getSubEntryForWeek(entry, "a") ||
          getSubEntryForWeek(entry, "b") ||
          getSubEntryForWeek(entry, "c");

        const firstSubEntry = getEffectiveSubEntry(firstSlotEntry);
        const firstSubject = firstSubEntry
          ? findSubjectCb(firstSubEntry.subjectId) || null
          : null;

        let span = 1;
        if (firstSubject) {
          for (let j = i + 1; j < timeSlots.length; j++) {
            const nextSlotEntry = findEntryForSlotCb(dayIndex, j);
            const nextSubEntry = getEffectiveSubEntry(nextSlotEntry);
            const nextSubject = nextSubEntry
              ? findSubjectCb(nextSubEntry.subjectId) || null
              : null;

            if (nextSubject && nextSubject.id === firstSubject?.id) {
              span++;
            } else {
              break;
            }
          }
        }

        displayCells.push({
          timeIndex: i,
          span: span,
          subjectToDisplay: firstSubject,
          subEntryToDisplay: firstSubEntry,
          currentFullEntry: firstSlotEntry,
          isMerged: span > 1,
        });
        i += span;
      }
      return displayCells;
    });
  }, [
    numberOfDays,
    timeSlots,
    findEntryForSlotCb,
    getSubEntryForWeek,
    currentWeekType,
    findSubjectCb,
  ]);

  return {
    timeSlotDurations,
    totalDayMinutes,
    displayDayNames,
    numberOfDays,
    gridTemplateRowsValue,
    getProcessedDays,
    findSubjectCb,
  };
}
