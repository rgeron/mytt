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
import React, { useMemo, useState } from "react";
import {
  ConflictResolutionDialog,
  type ConflictResolutionAction,
} from "./dialogs/ConflictResolutionDialog";

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
  const findEntryForSlot = (
    day: number,
    timeSlotIndex: number
  ): TimetableEntry | undefined => {
    return entries.find(
      (e) => e.day === day && e.timeSlotIndex === timeSlotIndex
    );
  };

  // Function to find a subject by ID
  const findSubject = (subjectId: string): Subject | undefined => {
    return subjects.find((subject) => subject.id === subjectId);
  };

  const getSubEntryForWeek = (
    entry: TimetableEntry | undefined,
    week: WeekDesignation
  ): TimetableSubEntry | undefined => {
    if (!entry) return undefined;
    const weekKey = `week${week.toUpperCase()}` as keyof Pick<
      TimetableEntry,
      "weekA" | "weekB" | "weekC"
    >;
    return entry[weekKey];
  };

  const handleCellClick = (dayIndex: number, timeSlotIndex: number) => {
    if (!selectedActivityId) return;

    const existingEntry = findEntryForSlot(dayIndex, timeSlotIndex);
    const newSubject = findSubject(selectedActivityId);
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
    const { dayIndex, timeSlotIndex, newSubjectId } = conflictDialogState;
    const newSubEntryData: TimetableSubEntry = { subjectId: newSubjectId };

    switch (action.type) {
      case "replaceAll":
        // Remove all existing sub-entries for this slot
        if (conflictDialogState.existingEntry?.weekA)
          removeSubEntry(dayIndex, timeSlotIndex, "a");
        if (conflictDialogState.existingEntry?.weekB)
          removeSubEntry(dayIndex, timeSlotIndex, "b");
        if (conflictDialogState.existingEntry?.weekC)
          removeSubEntry(dayIndex, timeSlotIndex, "c");
        // Add the new one to week A
        addEntry(dayIndex, timeSlotIndex, "a", newSubEntryData);
        break;
      case "replaceSpecific":
        // Remove the specified week's sub-entry
        removeSubEntry(dayIndex, timeSlotIndex, action.week);
        // Add the new one to the specified week
        addEntry(dayIndex, timeSlotIndex, action.week, newSubEntryData);
        break;
      case "addNewToWeek":
        // Add the new one to the specified week (e.g., adding to B or C, keeping A or A&B)
        addEntry(dayIndex, timeSlotIndex, action.week, newSubEntryData);
        break;
    }
    setConflictDialogState(null); // Close dialog
  };

  // Eraser for the whole slot: removes all week entries
  const handleRemoveFullEntry = (
    e: React.MouseEvent,
    dayIndex: number,
    timeSlotIndex: number
  ) => {
    e.stopPropagation();
    const entry = findEntryForSlot(dayIndex, timeSlotIndex);
    if (entry) {
      if (entry.weekA) removeSubEntry(dayIndex, timeSlotIndex, "a");
      if (entry.weekB) removeSubEntry(dayIndex, timeSlotIndex, "b");
      if (entry.weekC) removeSubEntry(dayIndex, timeSlotIndex, "c");
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
              <div className="bg-primary text-primary-foreground py-2 px-3 text-center font-medium text-sm">
                Horaires
              </div>

              {/* Header: Day columns */}
              {displayDayNames.map((day, index) => (
                <div
                  key={`day-${index}`}
                  className="bg-primary text-primary-foreground py-2 px-1 text-center font-medium text-sm"
                >
                  {day}
                </div>
              ))}

              {/* Time slots and entries */}
              {timeSlots.map((timeSlot, timeIndex) => {
                const slotPercentage =
                  totalDayMinutes > 0
                    ? (timeSlotDurations[timeIndex] / totalDayMinutes) * 100
                    : 0;
                const showTimeLabels = slotPercentage > 7;

                return (
                  <React.Fragment key={`slot-row-${timeIndex}`}>
                    {/* Time slot label */}
                    <div
                      key={`time-${timeIndex}`}
                      className="bg-secondary/30 text-center text-[10px] flex flex-col items-center justify-center font-medium"
                    >
                      {showTimeLabels && (
                        <div>
                          <div>
                            {timeSlot.start} - {timeSlot.end}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Entries for each day */}
                    {Array.from({ length: numberOfDays }).map((_, dayIndex) => {
                      const currentFullEntry = findEntryForSlot(
                        dayIndex,
                        timeIndex
                      );
                      // For now, display subject for currentWeekType or first available if not set
                      // Phase 3 will handle visual splitting of the cell.
                      const subEntryToDisplay =
                        getSubEntryForWeek(currentFullEntry, currentWeekType) ||
                        getSubEntryForWeek(currentFullEntry, "a") ||
                        getSubEntryForWeek(currentFullEntry, "b") ||
                        getSubEntryForWeek(currentFullEntry, "c");
                      const subjectToDisplay = subEntryToDisplay
                        ? findSubject(subEntryToDisplay.subjectId)
                        : null;
                      const hasAnyEntry =
                        currentFullEntry?.weekA ||
                        currentFullEntry?.weekB ||
                        currentFullEntry?.weekC;

                      return (
                        <div
                          key={`cell-${dayIndex}-${timeIndex}`}
                          className={cn(
                            "relative bg-card border border-border overflow-hidden transition-colors cursor-pointer group",
                            subjectToDisplay
                              ? "hover:bg-secondary/10"
                              : "hover:bg-muted/20"
                          )}
                          style={{
                            backgroundColor: subjectToDisplay
                              ? `${subjectToDisplay.color}20`
                              : undefined,
                            borderLeft: subjectToDisplay
                              ? `4px solid ${subjectToDisplay.color}`
                              : selectedActivityId &&
                                findSubject(selectedActivityId) // Preview for placement
                              ? `4px dashed ${
                                  findSubject(selectedActivityId)?.color ||
                                  "transparent"
                                }`
                              : undefined,
                          }}
                          onClick={() => handleCellClick(dayIndex, timeIndex)}
                        >
                          {subjectToDisplay && (
                            <>
                              <div
                                className={cn(
                                  "flex flex-col h-full justify-center",
                                  showTimeLabels ? "p-2" : "p-0"
                                )}
                              >
                                <div className="font-semibold text-xs text-foreground truncate">
                                  {subjectToDisplay.name}
                                </div>
                                {subEntryToDisplay?.room && showTimeLabels && (
                                  <div className="text-xs text-muted-foreground truncate mt-1">
                                    <span className="font-medium">Salle:</span>{" "}
                                    {subEntryToDisplay.room}
                                  </div>
                                )}
                                {subEntryToDisplay?.teacher &&
                                  showTimeLabels && (
                                    <div className="text-xs text-muted-foreground truncate">
                                      <span className="font-medium">Prof:</span>{" "}
                                      {subEntryToDisplay.teacher}
                                    </div>
                                  )}
                              </div>
                              {/* Eraser for the whole slot (all weeks) */}
                              {hasAnyEntry && (
                                <button
                                  title="Supprimer toutes les entrées de ce créneau"
                                  onClick={(e) =>
                                    handleRemoveFullEntry(
                                      e,
                                      dayIndex,
                                      timeIndex
                                    )
                                  }
                                  className="absolute top-0.5 right-0.5 p-0.5 bg-card/50 hover:bg-destructive/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10"
                                >
                                  <Trash2Icon className="h-3.5 w-3.5 text-destructive/80 hover:text-destructive" />
                                </button>
                              )}
                            </>
                          )}
                          {/* Display number of weeks filled or some indicator if multiple (Phase 3 detail) */}
                          {currentFullEntry &&
                            (currentFullEntry.weekA ||
                              currentFullEntry.weekB ||
                              currentFullEntry.weekC) &&
                            !subjectToDisplay && (
                              <div className="flex items-center justify-center h-full">
                                <InfoIcon className="h-4 w-4 text-muted-foreground/50" />
                              </div>
                            )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}
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
        findSubject={findSubject} // Pass findSubject function
        onResolve={handleConflictResolution} // Pass the resolver function
      />
    </div>
  );
}
