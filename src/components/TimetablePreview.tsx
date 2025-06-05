"use client";

import { cn } from "@/lib/utils";
import {
  useTimetableStore,
  type Subject,
  type TimetableEntry,
  type TimetableSubEntry,
  type WeekDesignation,
} from "@/store/timetable-store";
import { InfoIcon, MapPin, Users } from "lucide-react";
import Image from "next/image";
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
    globalFont,
    titleFont,
    titleColor,
    globalBackgroundColor,
    globalColor,
    backgroundImageUrl,
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
          fontFamily: globalFont,
          color: globalColor,
          // Apply background image here
          backgroundImage: backgroundImageUrl
            ? `url(${backgroundImageUrl})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Timetable content */}
        <div className="h-full w-full p-2 flex flex-col">
          <div className="text-center mb-2 relative">
            {/* Conditionally render the styled wrapper or plain text based on backgroundImageUrl */}
            {backgroundImageUrl ? (
              <div
                style={{
                  backgroundColor: globalBackgroundColor
                    ? `${globalBackgroundColor}B3`
                    : "rgba(255, 255, 255, 0.7)", // ~70% opacity
                  padding: "0.5rem 0.85rem", // User's preferred padding
                  borderRadius: "0.375rem", // Equivalent to Tailwind's rounded-md
                  display: "inline-block",
                  backdropFilter: "blur(4px)",
                  WebkitBackdropFilter: "blur(4px)", // For Safari compatibility
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                }}
              >
                <h1
                  className="text-2xl font-bold text-primary relative z-10"
                  style={{
                    fontFamily: titleFont,
                    color: titleColor,
                  }}
                >
                  {title}
                </h1>
                <p
                  className="text-sm relative z-10"
                  style={{
                    fontFamily: globalFont,
                    color: globalColor,
                  }}
                >
                  {subtitle}
                </p>
              </div>
            ) : (
              <>
                <h1
                  className="text-2xl font-bold text-primary"
                  style={{
                    fontFamily: titleFont,
                    color: titleColor,
                  }}
                >
                  {title}
                </h1>
                <p
                  className="text-sm"
                  style={{
                    fontFamily: globalFont,
                    color: globalColor,
                  }}
                >
                  {subtitle}
                </p>
              </>
            )}
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
                className="py-2 px-3 text-center font-medium text-sm"
                style={{
                  gridColumn: 1,
                  gridRow: 1,
                  backgroundColor: globalBackgroundColor,
                  color: globalColor,
                }}
              >
                Horaires
              </div>

              {/* Header: Day columns */}
              {displayDayNames.map((day, index) => (
                <div
                  key={`day-header-${index}`}
                  className="py-2 px-1 text-center font-medium text-sm"
                  style={{
                    gridColumn: index + 2,
                    gridRow: 1,
                    backgroundColor: globalBackgroundColor,
                    color: globalColor,
                  }}
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

                  let cellBackgroundColor: string | undefined = undefined;
                  if (!isMultiSubjectCell && subjectToDisplay) {
                    if (subjectToDisplay.subjectType === "break") {
                      cellBackgroundColor = `${
                        subjectToDisplay.color || "#333333"
                      }20`;
                    } else if (subjectToDisplay.color) {
                      cellBackgroundColor = `${subjectToDisplay.color}20`;
                    }
                  }

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
                        backgroundColor: cellBackgroundColor,
                        borderLeft: isMultiSubjectCell
                          ? selectedActivityId &&
                            findSubjectCb(selectedActivityId)
                            ? `4px dashed ${
                                findSubjectCb(selectedActivityId)?.color ||
                                "transparent"
                              }`
                            : undefined
                          : subjectToDisplay?.subjectType === "break"
                          ? undefined // Remove border for break subjects
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
                              const specificTeachersForStrip = ensureArray(
                                subEntry.teachers
                              );
                              const globalTeachersForStrip = ensureArray(
                                subject.teacherOrCoach
                              );
                              const actualTeachersForStrip =
                                specificTeachersForStrip.length > 0
                                  ? specificTeachersForStrip
                                  : globalTeachersForStrip;
                              const hasTeacher =
                                actualTeachersForStrip.length > 0;

                              const hasRoom = !!subEntry.room;
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
                                    "flex-1 overflow-hidden flex flex-col justify-center items-center text-center",
                                    index < arr.length - 1 ? "border-r" : "",
                                    contentDensity > 2 ? "p-0" : "p-0.5"
                                  )}
                                  style={{
                                    backgroundColor: `${stripEffectiveColor}20`,
                                    borderColor: `${stripEffectiveColor}50`,
                                  }}
                                >
                                  {/* Icon & Subject Name Section */}
                                  <div className="w-full flex items-center justify-center overflow-hidden">
                                    {hasIcon && stripEffectiveIcon && (
                                      <span className="inline-flex mr-0.5 text-[8px] overflow-hidden flex-nowrap">
                                        {Array.isArray(stripEffectiveIcon) ? (
                                          stripEffectiveIcon.map(
                                            (icon, idx) => (
                                              <span key={idx} className="mx-px">
                                                {icon}
                                              </span>
                                            )
                                          )
                                        ) : (
                                          <span className="mx-px">
                                            {stripEffectiveIcon}
                                          </span>
                                        )}
                                      </span>
                                    )}
                                    <div
                                      className={cn(
                                        "font-semibold truncate w-full",
                                        contentDensity > 2
                                          ? "text-[7px]"
                                          : showTimeLabelsInCell
                                          ? "text-[8px]"
                                          : "text-[7px]"
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
                                        "flex flex-col w-full overflow-hidden",
                                        contentDensity > 2 ? "gap-0" : "gap-0.5"
                                      )}
                                    >
                                      {/* Conditionally show image */}
                                      {hasImage && stripEffectiveImage && (
                                        <div className="w-full flex justify-center">
                                          <div className="w-3 h-3 overflow-hidden rounded-sm relative">
                                            <Image
                                              src={stripEffectiveImage}
                                              alt=""
                                              layout="fill"
                                              objectFit="cover"
                                            />
                                          </div>
                                        </div>
                                      )}

                                      {/* Room & Teacher info */}
                                      {hasRoom && (
                                        <div
                                          className={cn(
                                            "flex items-center truncate w-full",
                                            contentDensity > 2
                                              ? "text-[5px]"
                                              : "text-[6px]"
                                          )}
                                        >
                                          <MapPin className="h-2 w-2 mr-0.5 flex-shrink-0" />
                                          <span className="truncate">
                                            {subEntry.room}
                                          </span>
                                        </div>
                                      )}
                                      {hasTeacher && (
                                        <div
                                          className={cn(
                                            "flex items-center truncate w-full",
                                            contentDensity > 2
                                              ? "text-[5px]"
                                              : "text-[6px]"
                                          )}
                                        >
                                          <Users className="h-2 w-2 mr-0.5 flex-shrink-0" />
                                          <span className="truncate">
                                            {actualTeachersForStrip.join(", ")}
                                          </span>
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
                          const isBreakType =
                            subjectToDisplay.subjectType === "break";

                          // Special styling for breaks
                          const breakStyle = isBreakType
                            ? {
                                backgroundColor: `${
                                  effectiveColor || "#333333"
                                }`,
                              }
                            : {
                                backgroundColor: `${effectiveColor}20`,
                              };

                          const content = (
                            <div
                              className={cn(
                                "flex flex-col w-full overflow-hidden",
                                showTimeLabelsInCell ? "p-0.5" : "p-0.25",
                                "text-center",
                                isBreakType ? "text-white" : ""
                              )}
                            >
                              {/* Subject name with optional icon - only show if there's enough room for breaks */}
                              {(!isBreakType || showTimeLabelsInCell) && (
                                <div className="flex items-center justify-center overflow-hidden">
                                  {effectiveIcon && (
                                    <span className="inline-flex mr-0.5 text-[9px] overflow-hidden flex-nowrap">
                                      {Array.isArray(effectiveIcon) ? (
                                        effectiveIcon.map((icon, idx) => (
                                          <span key={idx} className="mx-px">
                                            {icon}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="mx-px">
                                          {effectiveIcon}
                                        </span>
                                      )}
                                    </span>
                                  )}
                                  <div
                                    className={cn(
                                      "font-semibold truncate w-full",
                                      showTimeLabelsInCell
                                        ? "text-[9px]"
                                        : "text-[8px]",
                                      isBreakType ? "text-white" : ""
                                    )}
                                  >
                                    {effectiveAbbreviation || effectiveName}
                                  </div>
                                </div>
                              )}

                              {/* Additional details with responsive visibility */}
                              {showTimeLabelsInCell && !isBreakType && (
                                <div className="mt-0.5 space-y-0.5 overflow-hidden">
                                  {subEntryToDisplay?.room && (
                                    <div className="text-[7px] flex items-center truncate">
                                      <MapPin className="h-2.5 w-2.5 mr-0.5 flex-shrink-0" />
                                      <span className="truncate">
                                        {subEntryToDisplay.room}
                                      </span>
                                    </div>
                                  )}
                                  {(() => {
                                    const specificTeachers = ensureArray(
                                      subEntryToDisplay?.teachers
                                    );
                                    const globalTeachers = ensureArray(
                                      subjectToDisplay?.teacherOrCoach
                                    );
                                    const teachersToDisplay =
                                      specificTeachers.length > 0
                                        ? specificTeachers
                                        : globalTeachers;
                                    const hasTeachersToDisplay =
                                      teachersToDisplay.length > 0;

                                    if (hasTeachersToDisplay) {
                                      return (
                                        <div className="text-[7px] flex items-center truncate">
                                          <Users className="h-2.5 w-2.5 mr-0.5 flex-shrink-0" />
                                          <span className="truncate">
                                            {teachersToDisplay.join(", ")}
                                          </span>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                              )}
                            </div>
                          );

                          if (
                            effectiveImage &&
                            imagePositionToUse === "left" &&
                            !isBreakType
                          ) {
                            return (
                              <div
                                className="flex h-full w-full overflow-hidden"
                                style={breakStyle}
                              >
                                <div className="h-full max-w-[20%] flex-shrink-0 flex items-center justify-center p-0.5 overflow-hidden relative">
                                  <Image
                                    src={effectiveImage}
                                    alt=""
                                    layout="fill"
                                    objectFit="contain"
                                  />
                                </div>
                                <div className="flex-1 flex items-center justify-center overflow-hidden">
                                  {content}
                                </div>
                              </div>
                            );
                          }
                          if (
                            effectiveImage &&
                            imagePositionToUse === "right" &&
                            !isBreakType
                          ) {
                            return (
                              <div
                                className="flex h-full w-full overflow-hidden"
                                style={breakStyle}
                              >
                                <div className="flex-1 flex items-center justify-center overflow-hidden">
                                  {content}
                                </div>
                                <div className="h-full max-w-[20%] flex-shrink-0 flex items-center justify-center p-0.5 overflow-hidden relative">
                                  <Image
                                    src={effectiveImage}
                                    alt=""
                                    layout="fill"
                                    objectFit="contain"
                                  />
                                </div>
                              </div>
                            );
                          }
                          // Content only (no image or invalid position, though invalid position should default to left)
                          return (
                            <div
                              className="flex flex-col h-full w-full justify-center overflow-hidden"
                              style={breakStyle}
                            >
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
