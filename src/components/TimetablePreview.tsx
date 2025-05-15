"use client";

import {
  useTimetableStore,
  type Subject,
  type TimetableEntry,
  type TimetableSubEntry,
  type WeekDesignation,
} from "@/lib/store/timetable-store";
import { cn } from "@/lib/utils";
import { InfoIcon, Trash2Icon } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import {
  ConflictResolutionDialog,
  type ConflictResolutionAction,
} from "./dialogs/ConflictResolutionDialog";

interface DayDisplayCell {
  timeIndex: number; // Starting time slot index of this display cell
  span: number; // Number of actual time slots this display cell covers
  subjectToDisplay: Subject | null;
  subEntryToDisplay: TimetableSubEntry | undefined; // Contains room, teacher for the first slot
  currentFullEntry: TimetableEntry | undefined; // Full entry object for the first slot of the span
  isMerged: boolean;
}

export function TimetablePreview() {
  const {
    title,
    subtitle,
    timeSlots,
    subjects,
    entries,
    showSaturday,
    selectedActivityId,
    addEntry,
    removeSubEntry,
    currentWeekType,
  } = useTimetableStore();

  const [conflictDialogState, setConflictDialogState] = useState<{
    dayIndex: number;
    timeSlotIndex: number;
    newSubjectId: string;
    existingEntry?: TimetableEntry;
  } | null>(null);

  // Calculate time slot durations to create proportional heights
  const timeSlotDurations = useMemo(() => {
    return timeSlots.map((slot) => {
      const startTime = parseTimeToMinutes(slot.start);
      const endTime = parseTimeToMinutes(slot.end);
      return endTime - startTime;
    });
  }, [timeSlots]);

  // Calculate total minutes in the day to proportionally size cells
  const totalDayMinutes = useMemo(() => {
    return timeSlotDurations.reduce((sum, duration) => sum + duration, 0);
  }, [timeSlotDurations]);

  // Parse time string (HH:MM) to minutes since midnight
  function parseTimeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(":").map(Number);
    return hours * 60 + minutes;
  }

  // Function to find an entry for a specific day and time slot
  const findEntryForSlotCb = useCallback(
    (day: number, timeSlotIndex: number): TimetableEntry | undefined => {
      return entries.find(
        (e) => e.day === day && e.timeSlotIndex === timeSlotIndex
      );
    },
    [entries]
  );

  // Function to find a subject by ID
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
    [] // No dependencies from component scope, relies only on arguments
  );

  const handleCellClick = (dayIndex: number, timeSlotIndex: number) => {
    if (!selectedActivityId) return;

    const existingEntry = findEntryForSlotCb(dayIndex, timeSlotIndex); // Use callback version
    const newSubject = findSubjectCb(selectedActivityId); // Use callback version
    if (!newSubject) return;

    const newSubEntryData: TimetableSubEntry = {
      subjectId: selectedActivityId,
    };

    // Check if the new subject is already present in any of the weeks
    const isAlreadyPresentA =
      existingEntry?.weekA?.subjectId === selectedActivityId;
    const isAlreadyPresentB =
      existingEntry?.weekB?.subjectId === selectedActivityId;
    const isAlreadyPresentC =
      existingEntry?.weekC?.subjectId === selectedActivityId;

    // If adding the same subject to a slot that already contains it (in any week), do nothing for now.
    // A future feature could allow editing properties like room/teacher here.
    if (isAlreadyPresentA || isAlreadyPresentB || isAlreadyPresentC) {
      // Optionally, select the existing entry or open an edit dialog in the future.
      // For now, if it's the same, we don't trigger conflict or add.
      return;
    }

    if (
      !existingEntry ||
      (!existingEntry.weekA && !existingEntry.weekB && !existingEntry.weekC)
    ) {
      // Slot is completely empty, add to weekA by default.
      addEntry(dayIndex, timeSlotIndex, "a", newSubEntryData);
    } else {
      // Slot has at least one activity, and it's different from the new one. Open conflict dialog.
      setConflictDialogState({
        dayIndex,
        timeSlotIndex,
        newSubjectId: selectedActivityId,
        existingEntry,
      });
    }
  };

  const handleConflictResolution = (action: ConflictResolutionAction) => {
    if (!conflictDialogState) return;
    const { dayIndex, timeSlotIndex, newSubjectId, existingEntry } =
      conflictDialogState;
    const newSubEntryData: TimetableSubEntry = { subjectId: newSubjectId }; // Used for replaceAll

    switch (action.type) {
      case "replaceAll":
        if (existingEntry?.weekA) removeSubEntry(dayIndex, timeSlotIndex, "a");
        if (existingEntry?.weekB) removeSubEntry(dayIndex, timeSlotIndex, "b");
        if (existingEntry?.weekC) removeSubEntry(dayIndex, timeSlotIndex, "c");
        addEntry(dayIndex, timeSlotIndex, "a", newSubEntryData);
        break;
      case "applyStagedArrangement":
        const { arrangement } = action;
        const weeks: WeekDesignation[] = ["a", "b", "c"];

        weeks.forEach((week) => {
          const currentSubjectInStore =
            existingEntry?.[`week${week.toUpperCase() as "A" | "B" | "C"}`]
              ?.subjectId || null;
          const newSubjectInArrangement = arrangement[week];

          if (currentSubjectInStore !== newSubjectInArrangement) {
            // If there was a subject and now there isn't, or it's different, remove the old one.
            if (currentSubjectInStore) {
              removeSubEntry(dayIndex, timeSlotIndex, week);
            }
            // If there is a new subject in the arrangement for this week, add it.
            if (newSubjectInArrangement) {
              addEntry(dayIndex, timeSlotIndex, week, {
                subjectId: newSubjectInArrangement,
              });
            }
          }
        });
        break;
      // Old cases like replaceSpecific and addNewToWeek are removed as DnD handles this via applyStagedArrangement
    }
    setConflictDialogState(null); // Close dialog
  };

  // Eraser for the whole slot: removes all week entries
  const handleRemoveFullEntry = (
    e: React.MouseEvent,
    dayIndex: number,
    startTimeSlotIndex: number,
    span: number = 1
  ) => {
    e.stopPropagation();
    for (let i = 0; i < span; i++) {
      const currentTimeSlotIndex = startTimeSlotIndex + i;
      const entry = findEntryForSlotCb(dayIndex, currentTimeSlotIndex); // Use callback version
      if (entry) {
        if (entry.weekA) removeSubEntry(dayIndex, currentTimeSlotIndex, "a");
        if (entry.weekB) removeSubEntry(dayIndex, currentTimeSlotIndex, "b");
        if (entry.weekC) removeSubEntry(dayIndex, currentTimeSlotIndex, "c");
      }
    }
  };

  // Day names in French
  const dayNames = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
  // Add Saturday if enabled
  const displayDayNames = showSaturday ? [...dayNames, "Samedi"] : dayNames;
  // Number of days to display
  const numberOfDays = showSaturday ? 6 : 5;

  const gridTemplateRowsValue = useMemo(() => {
    if (timeSlots.length === 0) {
      return "auto"; // Only header row if no time slots
    }
    if (totalDayMinutes === 0) {
      // All slots have zero duration, or no slots (covered by above)
      // Fallback to equal distribution for existing slots, with a min 1px height.
      return `auto repeat(${timeSlots.length}, minmax(1px, 1fr))`;
    }
    const rowFractions = timeSlotDurations
      .map((duration) => {
        const percentage = (duration / totalDayMinutes) * 100;
        // Use Math.max with a very small positive number to ensure the fr value is valid
        // and the row can render as a thin bar if percentage is tiny or zero.
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

  return (
    <div className="relative h-full w-full flex flex-col justify-center">
      {/* A4 Paper Preview - Landscape orientation */}
      <div
        id="timetable-preview"
        className="bg-white shadow-lg border border-gray-200 rounded-md overflow-hidden"
        style={{
          // A4 aspect ratio for landscape orientation (1.414:1)
          width: "98%",
          height: "auto",
          aspectRatio: "1.414/1",
          margin: "0 auto",
          maxHeight: "95vh",
        }}
      >
        {/* Timetable content */}
        <div className="h-full w-full p-2 flex flex-col">
          <div className="text-center mb-2">
            <h1 className="text-2xl font-bold text-primary">{title}</h1>
            <p className="text-muted-foreground text-sm">{subtitle}</p>
          </div>

          {/* Timetable grid container - uses flex-1 to take remaining space */}
          <div className="flex-1 flex flex-col">
            {/* Timetable grid */}
            <div
              className="flex-1 grid gap-0.5 bg-gray-50 overflow-hidden rounded-md"
              style={{
                gridTemplateColumns: `auto repeat(${numberOfDays}, 1fr)`,
                gridTemplateRows: gridTemplateRowsValue,
              }}
            >
              {/* Header: Time column */}
              <div
                className="bg-primary text-primary-foreground py-2 px-3 text-center font-medium text-sm"
                style={{ gridColumn: 1, gridRow: 1 }}
              >
                Horaires
              </div>

              {/* Header: Day columns */}
              {displayDayNames.map((day, index) => (
                <div
                  key={`day-header-${index}`}
                  className="bg-primary text-primary-foreground py-2 px-1 text-center font-medium text-sm"
                  style={{ gridColumn: index + 2, gridRow: 1 }}
                >
                  {day}
                </div>
              ))}

              {/* Time slot labels (Column 1) */}
              {timeSlots.map((timeSlot, timeIndex) => {
                const slotPercentage =
                  totalDayMinutes > 0
                    ? (timeSlotDurations[timeIndex] / totalDayMinutes) * 100
                    : 0;
                const showTimeLabels = slotPercentage > 7;

                return (
                  <div
                    key={`time-label-${timeIndex}`}
                    className="bg-secondary/30 text-center text-[10px] flex flex-col items-center justify-center font-medium"
                    style={{ gridColumn: 1, gridRow: timeIndex + 2 }}
                  >
                    {showTimeLabels && (
                      <div>
                        <div>
                          {timeSlot.start} - {timeSlot.end}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Entries for each day */}
              {getProcessedDays.map((dayCells, dayIndex) =>
                dayCells.map((cellData) => {
                  let showTimeLabelsInCell = false;
                  if (cellData.span === 1) {
                    const slotPercentage =
                      totalDayMinutes > 0 &&
                      cellData.timeIndex < timeSlotDurations.length
                        ? (timeSlotDurations[cellData.timeIndex] /
                            totalDayMinutes) *
                          100
                        : 0;
                    showTimeLabelsInCell = slotPercentage > 7;
                  } else {
                    let combinedDuration = 0;
                    for (let k = 0; k < cellData.span; k++) {
                      if (cellData.timeIndex + k < timeSlotDurations.length) {
                        combinedDuration +=
                          timeSlotDurations[cellData.timeIndex + k];
                      }
                    }
                    const slotPercentage =
                      totalDayMinutes > 0
                        ? (combinedDuration / totalDayMinutes) * 100
                        : 0;
                    showTimeLabelsInCell = slotPercentage > 3; // Lower threshold for taller merged cells
                  }

                  const { subjectToDisplay, subEntryToDisplay } = cellData;
                  const fullEntry = cellData.currentFullEntry;
                  const hasAnyEntryInFirstSlot =
                    fullEntry?.weekA || fullEntry?.weekB || fullEntry?.weekC;

                  const weekSubEntries = {
                    a: fullEntry?.weekA,
                    b: fullEntry?.weekB,
                    c: fullEntry?.weekC,
                  };

                  const activeWeekSubjects: {
                    week: WeekDesignation;
                    subject: Subject;
                    subEntry: TimetableSubEntry;
                  }[] = [];
                  (["a", "b", "c"] as WeekDesignation[]).forEach((week) => {
                    const subEntry =
                      weekSubEntries[week as keyof typeof weekSubEntries];
                    if (subEntry) {
                      const subject = findSubjectCb(subEntry.subjectId);
                      if (subject) {
                        activeWeekSubjects.push({ week, subject, subEntry });
                      }
                    }
                  });

                  const uniqueSubjectIdsInCell = Array.from(
                    new Set(activeWeekSubjects.map((item) => item.subject.id))
                  );
                  const isMultiSubjectCell = uniqueSubjectIdsInCell.length > 1;

                  return (
                    <div
                      key={`cell-${dayIndex}-${cellData.timeIndex}`}
                      className={cn(
                        "relative bg-card border border-border overflow-hidden transition-colors cursor-pointer group",
                        subjectToDisplay && !isMultiSubjectCell
                          ? "hover:bg-secondary/10" // Hover specific to single subject display
                          : "hover:bg-muted/20" // Generic hover for multi-subject or empty
                      )}
                      style={{
                        gridColumn: dayIndex + 2,
                        gridRowStart: cellData.timeIndex + 2,
                        gridRowEnd: `span ${cellData.span}`,
                        backgroundColor:
                          isMultiSubjectCell || !subjectToDisplay
                            ? undefined // Rely on bg-card or strips' background
                            : `${subjectToDisplay.color}20`,
                        borderLeft: isMultiSubjectCell
                          ? selectedActivityId &&
                            findSubjectCb(selectedActivityId)
                            ? `4px dashed ${
                                findSubjectCb(selectedActivityId)?.color ||
                                "transparent"
                              }`
                            : undefined
                          : subjectToDisplay
                          ? `4px solid ${subjectToDisplay.color}`
                          : selectedActivityId &&
                            findSubjectCb(selectedActivityId)
                          ? `4px dashed ${
                              findSubjectCb(selectedActivityId)?.color ||
                              "transparent"
                            }`
                          : undefined,
                      }}
                      onClick={() =>
                        handleCellClick(dayIndex, cellData.timeIndex)
                      }
                    >
                      {isMultiSubjectCell ? (
                        <div className="flex flex-row h-full w-full">
                          {activeWeekSubjects.map(
                            ({ week, subject, subEntry }, index, arr) => (
                              <div
                                key={`week-strip-${week}`}
                                className={cn(
                                  "flex-1 p-1 overflow-hidden flex flex-col justify-center items-center text-center",
                                  index < arr.length - 1
                                    ? "border-r" // Add border to all but the last strip
                                    : ""
                                )}
                                style={{
                                  backgroundColor: `${subject.color}20`,
                                  borderColor: `${subject.color}50`, // Make border same color as bg but darker
                                }}
                              >
                                <div className="font-semibold text-[10px] text-foreground truncate w-full">
                                  {subject.name}
                                </div>
                                <div className="text-[8px] text-muted-foreground/80">
                                  {`Sem. ${week.toUpperCase()}`}
                                </div>
                                {subEntry.room && showTimeLabelsInCell && (
                                  <div className="text-[9px] text-muted-foreground truncate w-full">
                                    S: {subEntry.room}
                                  </div>
                                )}
                                {subEntry.teacher && showTimeLabelsInCell && (
                                  <div className="text-[9px] text-muted-foreground truncate w-full">
                                    P: {subEntry.teacher}
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      ) : subjectToDisplay ? (
                        // Existing single subject display logic
                        <div
                          className={cn(
                            "flex flex-col h-full justify-center",
                            showTimeLabelsInCell ? "p-2" : "p-0 text-center"
                          )}
                        >
                          <div className="font-semibold text-xs text-foreground truncate">
                            {subjectToDisplay.name}
                          </div>
                          {subEntryToDisplay?.room && showTimeLabelsInCell && (
                            <div className="text-xs text-muted-foreground truncate mt-1">
                              <span className="font-medium">Salle:</span>{" "}
                              {subEntryToDisplay.room}
                            </div>
                          )}
                          {subEntryToDisplay?.teacher &&
                            showTimeLabelsInCell && (
                              <div className="text-xs text-muted-foreground truncate">
                                <span className="font-medium">Prof:</span>{" "}
                                {subEntryToDisplay.teacher}
                              </div>
                            )}
                        </div>
                      ) : null}

                      {/* Eraser Icon: Show if there's any entry in the slot (original or multi) */}
                      {hasAnyEntryInFirstSlot && (
                        <button
                          title="Supprimer toutes les entrées de ce créneau"
                          onClick={(e) =>
                            handleRemoveFullEntry(
                              e,
                              dayIndex,
                              cellData.timeIndex,
                              cellData.span
                            )
                          }
                          className="absolute top-0.5 right-0.5 p-0.5 bg-card/50 hover:bg-destructive/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10"
                        >
                          <Trash2Icon className="h-3.5 w-3.5 text-destructive/80 hover:text-destructive" />
                        </button>
                      )}

                      {/* Info Icon: Show if not multi-subject, no effective subject displayed, but other weeks have data */}
                      {!isMultiSubjectCell &&
                        !subjectToDisplay &&
                        hasAnyEntryInFirstSlot && (
                          <div className="flex items-center justify-center h-full">
                            <InfoIcon className="h-4 w-4 text-muted-foreground/50" />
                          </div>
                        )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Use the new ConflictResolutionDialog component */}
      <ConflictResolutionDialog
        isOpen={conflictDialogState !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setConflictDialogState(null);
          }
        }}
        dialogData={
          conflictDialogState
            ? {
                newSubjectId: conflictDialogState.newSubjectId,
                existingEntry: conflictDialogState.existingEntry,
              }
            : null
        }
        findSubject={findSubjectCb} // Pass callback version
        onResolve={handleConflictResolution} // Pass the resolver function
      />
    </div>
  );
}
