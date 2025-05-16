"use client";

import {
  useTimetableStore,
  type Subject,
  type TimetableEntry,
  type TimetableSubEntry,
  type WeekDesignation,
} from "@/lib/store/timetable-store";
import { cn } from "@/lib/utils";
import { InfoIcon, MapPin, Users } from "lucide-react";
import { useCallback, useMemo } from "react";

// Copied from TimetablePreview.tsx
interface DayDisplayCell {
  timeIndex: number;
  span: number;
  subjectToDisplay: Subject | null;
  subEntryToDisplay: TimetableSubEntry | undefined;
  currentFullEntry: TimetableEntry | undefined;
  isMerged: boolean;
}

export function TimetablePrintView() {
  const {
    title,
    subtitle,
    timeSlots,
    subjects,
    entries,
    showSaturday,
    // selectedActivityId, // Not needed for print
    // addEntry, // Not needed for print
    // removeSubEntry, // Not needed for print
    currentWeekType,
    // setSelectedSlotForPanel, // Not needed for print
    // isEraserModeActive, // Not needed for print
    globalFont,
    titleFont,
    titleColor,
    globalBackgroundColor,
    globalColor,
    backgroundImageUrl,
  } = useTimetableStore();

  // --- Helper functions and memoized values from TimetablePreview.tsx ---

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

  const ensureArray = (value: string | string[] | undefined): string[] => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  };

  function parseTimeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(":").map(Number);
    return hours * 60 + minutes;
  }

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

  const dayNames = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
  const displayDayNames = showSaturday ? [...dayNames, "Samedi"] : dayNames;
  const numberOfDays = showSaturday ? 6 : 5;

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

  // --- End of helper functions and memoized values ---

  return (
    <>
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0;
            padding: 0;
          }
          #timetable-preview-print {
            width: 100% !important;
            height: auto !important; /* Let aspect ratio control height based on 100% width of print area */
            margin: 0 auto !important;
            padding: 0 !important; /* Remove any padding that might affect fit */
            box-shadow: none !important;
            border: none !important;
            page-break-inside: avoid !important;
            overflow: hidden !important; /* Prevent content from spilling out */
            display: block !important; /* Ensure it behaves as a block for sizing */
          }
          /* If you have a specific wrapper ID around TimetablePrintView when printing, use it */
          /* For example, if a modal with ID 'print-modal-content' hosts this component: */
          /* #print-modal-content body > *:not(#timetable-preview-print) { display: none !important; } */
          /* #print-modal-content #timetable-preview-print { width: 100%; height: 100%; } */
        }
      `}</style>
      <div
        id="timetable-preview-print" // Keep this ID for potential print-specific CSS
        className="bg-white shadow-lg border border-gray-200 rounded-md overflow-hidden" // Base styling from Preview
        style={{
          width: "100%", // For print, usually width is 100% of the container
          height: "auto",
          aspectRatio: "1.414/1", // Maintain A4 landscape aspect ratio
          margin: "0 auto", // Center if within a larger print area
          fontFamily: globalFont,
          color: globalColor,
          backgroundImage: backgroundImageUrl
            ? `url(${backgroundImageUrl})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="h-full w-full p-2 flex flex-col">
          <div className="text-center mb-2 relative">
            {backgroundImageUrl ? (
              <div
                style={{
                  backgroundColor: globalBackgroundColor
                    ? `${globalBackgroundColor}B3` // ~70% opacity
                    : "rgba(255, 255, 255, 0.7)",
                  padding: "0.5rem 0.85rem",
                  borderRadius: "0.375rem",
                  display: "inline-block",
                  backdropFilter: "blur(4px)",
                  WebkitBackdropFilter: "blur(4px)",
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

          <div className="flex-1 flex flex-col">
            <div
              className="flex-1 grid gap-0.5 bg-gray-50 overflow-hidden rounded-md" // Minor styling adjustment for print if needed
              style={{
                gridTemplateColumns: `auto repeat(${numberOfDays}, 1fr)`,
                gridTemplateRows: gridTemplateRowsValue,
              }}
            >
              <div
                className="py-2 px-3 text-center font-medium text-sm" // Ensure consistent padding/text size
                style={{
                  gridColumn: 1,
                  gridRow: 1,
                  backgroundColor: globalBackgroundColor,
                  color: globalColor,
                }}
              >
                Horaires
              </div>

              {displayDayNames.map((day, index) => (
                <div
                  key={`day-header-${index}`}
                  className="py-2 px-1 text-center font-medium text-sm" // Ensure consistent padding/text size
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

              {timeSlots.map((timeSlot, timeIndex) => {
                const slotPercentage =
                  totalDayMinutes > 0
                    ? (timeSlotDurations[timeIndex] / totalDayMinutes) * 100
                    : 0;
                // Consistent logic for showing time labels
                const showTimeLabels = slotPercentage > 7;

                return (
                  <div
                    key={`time-label-${timeIndex}`}
                    className="bg-secondary/30 text-center text-[10px] flex flex-col items-center justify-center font-medium" // Consistent styling
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

              {getProcessedDays.map((dayCells, dayIndex) =>
                dayCells.map((cellData) => {
                  // Logic for showTimeLabelsInCell from TimetablePreview
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
                    showTimeLabelsInCell = slotPercentage > 3;
                  }

                  const { subjectToDisplay, subEntryToDisplay } = cellData;
                  const fullEntry = cellData.currentFullEntry;
                  const hasAnyEntryInFirstSlot =
                    fullEntry?.weekA || fullEntry?.weekB || fullEntry?.weekC;

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
                      }20`; // Preview uses '20' opacity
                    } else if (subjectToDisplay.color) {
                      cellBackgroundColor = `${subjectToDisplay.color}20`;
                    }
                  }

                  // Border styling for print - ensure it matches preview logic.
                  // For print, dashed borders might render as solid or be less distinct.
                  // Solid borders are generally safer for print.
                  let borderLeftStyle: string | undefined = undefined;
                  if (isMultiSubjectCell) {
                    // In preview, this was a dashed border if selectedActivityId.
                    // For print, we might simplify or use a subtle indicator, or replicate if possible.
                    // For now, let's keep it undefined or a generic subtle border.
                    // borderLeftStyle = "4px solid #eeeeee"; // Example subtle separator
                  } else if (subjectToDisplay?.subjectType === "break") {
                    borderLeftStyle = undefined; // No border for breaks
                  } else if (effectiveColor) {
                    borderLeftStyle = `4px solid ${effectiveColor}`;
                  } else {
                    // In preview, this was a dashed border if selectedActivityId.
                    // For print, this case (empty cell, no active selection) usually means no special border.
                    borderLeftStyle = undefined;
                  }

                  return (
                    <div
                      key={`cell-${dayIndex}-${cellData.timeIndex}`}
                      className={cn(
                        "relative bg-card border border-border overflow-hidden" // Removed hover states and cursor for print
                        // "transition-colors group", // Not relevant for print
                      )}
                      style={{
                        gridColumn: dayIndex + 2,
                        gridRowStart: cellData.timeIndex + 2,
                        gridRowEnd: `span ${cellData.span}`,
                        backgroundColor: cellBackgroundColor,
                        borderLeft: borderLeftStyle,
                        // onClick is removed for print view
                      }}
                    >
                      {isMultiSubjectCell ? (
                        <div className="flex flex-row h-full w-full">
                          {activeWeekSubjects.map(
                            ({ week, subject, subEntry }, index, arr) => {
                              const stripEffectiveColor = subject.color;
                              const stripEffectiveAbbreviation =
                                subject.abbreviation;
                              const stripEffectiveName = subject.name;
                              const stripEffectiveIcon = subject.icon;
                              const stripEffectiveImage = subject.image;

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
                                    index < arr.length - 1 ? "border-r" : "", // Keep border-r for visual separation
                                    contentDensity > 2 ? "p-0" : "p-0.5" // Keep padding logic
                                  )}
                                  style={{
                                    backgroundColor: `${stripEffectiveColor}20`,
                                    borderColor: `${stripEffectiveColor}50`, // Keep border color for strip separation
                                  }}
                                >
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
                                  <div className="text-[6px] text-muted-foreground/70">
                                    {`S. ${week.toUpperCase()}`}
                                  </div>
                                  {showTimeLabelsInCell && (
                                    <div
                                      className={cn(
                                        "flex flex-col w-full overflow-hidden",
                                        contentDensity > 2 ? "gap-0" : "gap-0.5"
                                      )}
                                    >
                                      {hasImage && stripEffectiveImage && (
                                        <div className="w-full flex justify-center">
                                          <div className="w-3 h-3 overflow-hidden rounded-sm">
                                            <img
                                              src={stripEffectiveImage}
                                              alt="" // Alt text for accessibility, though for print might be decorative
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
                        (() => {
                          const imagePositionToUse =
                            subjectToDisplay?.imagePosition || "left";
                          const isBreakType =
                            subjectToDisplay.subjectType === "break";

                          // Style for breaks in print view
                          const breakStyle = isBreakType
                            ? {
                                backgroundColor: `${
                                  effectiveColor || "#333333" // Solid color for break background
                                }`,
                              }
                            : {
                                backgroundColor: `${effectiveColor}20`, // Standard opacity for non-breaks
                              };

                          const content = (
                            <div
                              className={cn(
                                "flex flex-col w-full overflow-hidden",
                                showTimeLabelsInCell ? "p-0.5" : "p-0.25",
                                "text-center",
                                isBreakType ? "text-white" : "" // Text color for breaks
                              )}
                            >
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
                                style={breakStyle} // Apply breakStyle which includes cell background
                              >
                                <div className="h-full max-w-[20%] flex-shrink-0 flex items-center justify-center p-0.5 overflow-hidden">
                                  <img
                                    src={effectiveImage}
                                    alt="" // Decorative for print
                                    className="max-h-full max-w-full object-contain"
                                    onError={(e) => {
                                      (
                                        e.target as HTMLImageElement
                                      ).style.display = "none";
                                    }}
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
                                style={breakStyle} // Apply breakStyle
                              >
                                <div className="flex-1 flex items-center justify-center overflow-hidden">
                                  {content}
                                </div>
                                <div className="h-full max-w-[20%] flex-shrink-0 flex items-center justify-center p-0.5 overflow-hidden">
                                  <img
                                    src={effectiveImage}
                                    alt="" // Decorative for print
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
                          return (
                            <div
                              className="flex flex-col h-full w-full justify-center overflow-hidden"
                              style={breakStyle} // Apply breakStyle
                            >
                              {content}
                            </div>
                          );
                        })()
                      ) : (
                        hasAnyEntryInFirstSlot && ( // Show InfoIcon if there's data in other weeks but not current
                          <div className="flex items-center justify-center h-full">
                            <InfoIcon className="h-4 w-4 text-muted-foreground/50" />
                          </div>
                        )
                      )}
                      {/* Redundant InfoIcon from preview logic removed as it's covered by the above 'hasAnyEntryInFirstSlot'
                          and !subjectToDisplay condition for the current week.
                      */}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
