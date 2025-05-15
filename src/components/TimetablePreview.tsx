"use client";

import {
  useTimetableStore,
  type Subject,
  type TimetableEntry,
  type TimetableSubEntry,
  type WeekDesignation,
} from "@/lib/store/timetable-store";
import { cn } from "@/lib/utils";
import { InfoIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
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
    setSelectedSlotForPanel,
    isEraserModeActive,
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

  // Helper to ensure values are arrays
  const ensureArray = (value: string | string[] | undefined): string[] => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  };

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
    // Always set the selected slot for the panel first
    setSelectedSlotForPanel({ day: dayIndex, timeSlotIndex });

    // Eraser Mode: If eraser is active, clear the slot and return.
    if (isEraserModeActive) {
      const entry = findEntryForSlotCb(dayIndex, timeSlotIndex);
      if (entry) {
        if (entry.weekA) removeSubEntry(dayIndex, timeSlotIndex, "a");
        if (entry.weekB) removeSubEntry(dayIndex, timeSlotIndex, "b");
        if (entry.weekC) removeSubEntry(dayIndex, timeSlotIndex, "c");
      }
      return; // Exit after erasing
    }

    // If not in eraser mode, and no activity is selected from the panel, do nothing.
    if (!selectedActivityId) return;

    const existingEntry = findEntryForSlotCb(dayIndex, timeSlotIndex);
    const newSubject = findSubjectCb(selectedActivityId);
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

                  // Determine effective properties for single subject display / non-multi-subject cell context
                  const effectiveColor = subjectToDisplay?.color;
                  const effectiveAbbreviation = subjectToDisplay?.abbreviation;
                  const effectiveName = subjectToDisplay?.name;
                  const effectiveIcon = subjectToDisplay?.icon;
                  const effectiveImage = subjectToDisplay?.image;

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
                          ? "hover:bg-secondary/10"
                          : "hover:bg-muted/20"
                      )}
                      style={{
                        gridColumn: dayIndex + 2,
                        gridRowStart: cellData.timeIndex + 2,
                        gridRowEnd: `span ${cellData.span}`,
                        backgroundColor:
                          isMultiSubjectCell || !effectiveColor
                            ? undefined
                            : `${effectiveColor}20`,
                        borderLeft: isMultiSubjectCell
                          ? selectedActivityId &&
                            findSubjectCb(selectedActivityId)
                            ? `4px dashed ${
                                findSubjectCb(selectedActivityId)?.color ||
                                "transparent"
                              }`
                            : undefined
                          : effectiveColor
                          ? `4px solid ${effectiveColor}`
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
                            ({ week, subject, subEntry }, index, arr) => {
                              // For multi-subject strips, calculate effective properties per strip
                              const stripEffectiveColor = subject.color;
                              const stripEffectiveAbbreviation =
                                subject.abbreviation;
                              const stripEffectiveName = subject.name;
                              const stripEffectiveIcon = subject.icon;
                              const stripEffectiveImage = subject.image;

                              // Calculate content density to adjust display
                              const hasRoom = !!subEntry.room;
                              const hasTeacher =
                                ensureArray(subEntry.teachers).length > 0;
                              const hasIcon = !!stripEffectiveIcon;
                              const hasImage = !!stripEffectiveImage;
                              const contentDensity = [
                                hasRoom,
                                hasTeacher,
                                hasIcon,
                                hasImage,
                              ].filter(Boolean).length;

                              return (
                                <div
                                  key={`week-strip-${week}`}
                                  className={cn(
                                    "flex-1 p-0.5 overflow-hidden flex flex-col justify-center items-center text-center",
                                    index < arr.length - 1 ? "border-r" : ""
                                  )}
                                  style={{
                                    backgroundColor: `${stripEffectiveColor}20`,
                                    borderColor: `${stripEffectiveColor}50`,
                                  }}
                                >
                                  {/* Icon & Subject Name Section */}
                                  <div className="w-full flex items-center justify-center">
                                    {hasIcon && stripEffectiveIcon && (
                                      <span className="inline-block mr-0.5 text-[8px]">
                                        {stripEffectiveIcon}
                                      </span>
                                    )}
                                    <div
                                      className={cn(
                                        "font-semibold text-foreground truncate w-full",
                                        contentDensity > 2
                                          ? "text-[8px]"
                                          : "text-[9px]"
                                      )}
                                    >
                                      {stripEffectiveAbbreviation ||
                                        stripEffectiveName}
                                    </div>
                                  </div>

                                  {/* Week designation */}
                                  <div className="text-[6px] text-muted-foreground/70">
                                    {`S. ${week.toUpperCase()}`}
                                  </div>

                                  {/* Additional content if there's space */}
                                  {showTimeLabelsInCell && (
                                    <div
                                      className={cn(
                                        "flex flex-col w-full",
                                        contentDensity > 2 ? "gap-0" : "gap-0.5"
                                      )}
                                    >
                                      {/* Conditionally show image */}
                                      {hasImage && stripEffectiveImage && (
                                        <div className="w-full flex justify-center">
                                          <div className="w-4 h-4 overflow-hidden rounded-sm">
                                            <img
                                              src={stripEffectiveImage}
                                              alt=""
                                              className="w-full h-full object-cover"
                                              onError={(e) => {
                                                (
                                                  e.target as HTMLImageElement
                                                ).style.display = "none";
                                              }}
                                            />
                                          </div>
                                        </div>
                                      )}

                                      {/* Room & Teacher info */}
                                      {hasRoom && (
                                        <div
                                          className={cn(
                                            "text-muted-foreground truncate w-full",
                                            contentDensity > 2
                                              ? "text-[6px]"
                                              : "text-[7px]"
                                          )}
                                        >
                                          <span className="font-medium">
                                            S:
                                          </span>{" "}
                                          {subEntry.room}
                                        </div>
                                      )}
                                      {hasTeacher && (
                                        <div
                                          className={cn(
                                            "text-muted-foreground truncate w-full",
                                            contentDensity > 2
                                              ? "text-[6px]"
                                              : "text-[7px]"
                                          )}
                                        >
                                          <span className="font-medium">
                                            P:
                                          </span>{" "}
                                          {ensureArray(subEntry.teachers).join(
                                            ", "
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            }
                          )}
                        </div>
                      ) : subjectToDisplay ? (
                        // Single subject display logic with effective properties
                        (() => {
                          const imagePositionToUse =
                            subjectToDisplay?.imagePosition || "left";

                          const content = (
                            <div
                              className={cn(
                                "flex flex-col w-full",
                                showTimeLabelsInCell ? "p-1" : "p-0.5",
                                "text-center"
                              )}
                            >
                              {/* Subject name with optional icon */}
                              <div className="flex items-center justify-center">
                                {effectiveIcon && (
                                  <span className="inline-block mr-0.5 text-[10px]">
                                    {effectiveIcon}
                                  </span>
                                )}
                                <div className="font-semibold text-[10px] text-foreground truncate w-full">
                                  {effectiveAbbreviation || effectiveName}
                                </div>
                              </div>

                              {/* Additional details with responsive visibility */}
                              {showTimeLabelsInCell && (
                                <div className="mt-0.5 space-y-0.5">
                                  {subEntryToDisplay?.room && (
                                    <div className="text-[8px] text-muted-foreground truncate">
                                      <span className="font-medium">S:</span>{" "}
                                      {subEntryToDisplay.room}
                                    </div>
                                  )}
                                  {Array.isArray(subEntryToDisplay?.teachers)
                                    ? subEntryToDisplay.teachers.length > 0 && (
                                        <div className="text-[8px] text-muted-foreground truncate">
                                          <span className="font-medium">
                                            P:
                                          </span>{" "}
                                          {subEntryToDisplay.teachers.join(
                                            ", "
                                          )}
                                        </div>
                                      )
                                    : subEntryToDisplay?.teachers && (
                                        <div className="text-[8px] text-muted-foreground truncate">
                                          <span className="font-medium">
                                            P:
                                          </span>{" "}
                                          {subEntryToDisplay.teachers}
                                        </div>
                                      )}
                                </div>
                              )}
                            </div>
                          );

                          if (effectiveImage && imagePositionToUse === "left") {
                            return (
                              <div className="flex h-full w-full">
                                <div className="h-full max-w-[20%] flex-shrink-0 flex items-center justify-center p-0.5">
                                  <img
                                    src={effectiveImage}
                                    alt=""
                                    className="max-h-full max-w-full object-contain"
                                    onError={(e) => {
                                      (
                                        e.target as HTMLImageElement
                                      ).style.display = "none";
                                    }}
                                  />
                                </div>
                                <div className="flex-1 flex items-center justify-center">
                                  {content}
                                </div>
                              </div>
                            );
                          }
                          if (
                            effectiveImage &&
                            imagePositionToUse === "right"
                          ) {
                            return (
                              <div className="flex h-full w-full">
                                <div className="flex-1 flex items-center justify-center">
                                  {content}
                                </div>
                                <div className="h-full max-w-[20%] flex-shrink-0 flex items-center justify-center p-0.5">
                                  <img
                                    src={effectiveImage}
                                    alt=""
                                    className="max-h-full max-w-full object-contain"
                                    onError={(e) => {
                                      (
                                        e.target as HTMLImageElement
                                      ).style.display = "none";
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          }
                          // Content only (no image or invalid position, though invalid position should default to left)
                          return (
                            <div className="flex flex-col h-full w-full justify-center overflow-hidden">
                              {content}
                            </div>
                          );
                        })()
                      ) : (
                        // This is the !subjectToDisplay case for a non-multi-subject cell
                        hasAnyEntryInFirstSlot && (
                          <div className="flex items-center justify-center h-full">
                            <InfoIcon className="h-4 w-4 text-muted-foreground/50" />
                          </div>
                        )
                      )}

                      {/* Info Icon: Show if not multi-subject, no effective subject displayed, but other weeks have data */}
                      {/* This specific InfoIcon rendering might be redundant now or needs to be re-evaluated based on the logic above */}
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
