"use client";

import {
  useTimetableStore,
  type Subject,
  type TimetableSubEntry,
  type WeekDesignation,
} from "@/lib/store/timetable-store";
import { cn } from "@/lib/utils";
import { InfoIcon, MapPin, Users } from "lucide-react";
// Removed useCallback, useMemo as they are now in the helper hook
import { useTimetablePrintHelpers } from "@/lib/timetable-print-helpers"; // Adjust path as necessary
import { ensureArray } from "@/lib/timetable-print-utils";

// Copied from TimetablePreview.tsx
// DayDisplayCell interface moved to timetable-print-helpers.ts

export function TimetablePrintView() {
  const {
    title,
    subtitle,
    timeSlots,
    subjects,
    entries,
    showSaturday,
    currentWeekType,
    globalFont,
    titleFont,
    titleColor,
    globalBackgroundColor,
    globalColor,
    backgroundImageUrl,
  } = useTimetableStore();

  // --- Use the custom hook for helper functions and memoized values ---
  const {
    timeSlotDurations,
    totalDayMinutes,
    displayDayNames,
    numberOfDays,
    gridTemplateRowsValue,
    getProcessedDays,
    findSubjectCb, // findSubjectCb is returned by the hook
  } = useTimetablePrintHelpers({
    timeSlots,
    entries,
    subjects,
    showSaturday,
    currentWeekType,
  });

  // ensureArray is imported directly
  // parseTimeToMinutes is used internally by the hook

  // --- End of helper functions and memoized values ---

  return (
    <>
      <style jsx global>{`
        @media print {
          /* --- GLOBAL COLOR ADJUST --- */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* --- RESET DEFAULT PAGE MARGINS --- */
          body {
            margin: 0 !important;
            padding: 0 !important;
          }

          /* --- FORCE A4 LANDSCAPE AND REMOVE PRINTER MARGINS --- */
          @page {
            size: A4 landscape;
            margin: 0;
          }

          /* ------------------------------------------------------------------
       PRIMARY CONTAINER – MUST MATCH PAGE ORIENTATION (297 × 210 mm)
       ------------------------------------------------------------------ */
          #timetable-preview-print {
            /* 297 mm = côté le plus long en paysage, 210 mm = côté le plus court */
            width: 297mm !important;
            height: 210mm !important;

            /* inutile / contradictoire : supprimé → la règle ci-dessus prime */
            /* width: 100% !important; */
            /* height: auto !important; */

            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            page-break-inside: avoid !important;
            overflow: visible !important;
            display: block !important;
            background: white !important;
          }

          /* ------------------------------------------------------------------
       INTERNAL LAYOUT HELPERS
       ------------------------------------------------------------------ */
          .print-container {
            width: 100% !important;
            height: 100% !important; /* remplit exactement #timetable-preview-print */
            display: flex !important;
            flex-direction: column !important;
            padding: 8px !important;
          }

          .print-header {
            flex-shrink: 0 !important;
            margin-bottom: 8px !important;
          }

          .print-grid-container {
            flex: 1 !important;
            min-height: 0 !important;
            overflow: visible !important;
          }

          .print-grid {
            width: 100% !important;
            height: 100% !important;
            font-size: 10px !important;
          }

          .print-cell {
            font-size: 8px !important;
            line-height: 1.1 !important;
          }

          .print-time-cell {
            font-size: 7px !important;
            padding: 2px !important;
          }

          .print-day-header {
            font-size: 9px !important;
            padding: 4px 2px !important;
            font-weight: 600 !important;
          }
        }
      `}</style>
      <div
        id="timetable-preview-print"
        className="bg-white shadow-lg border border-gray-200 rounded-md overflow-hidden"
        style={{
          width: "210mm", // A4 landscape width
          height: "297mm", // A4 landscape height (but will be constrained by content)
          maxWidth: "100%",
          margin: "0 auto",
          fontFamily: globalFont,
          color: globalColor,
          backgroundImage: backgroundImageUrl
            ? `url(${backgroundImageUrl})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="print-container h-full w-full flex flex-col">
          <div className="print-header text-center relative">
            {backgroundImageUrl ? (
              <div
                style={{
                  backgroundColor: globalBackgroundColor
                    ? `${globalBackgroundColor}B3`
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
                  className="text-xl font-bold text-primary relative z-10"
                  style={{
                    fontFamily: titleFont,
                    color: titleColor,
                  }}
                >
                  {title}
                </h1>
                <p
                  className="text-xs relative z-10"
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
                  className="text-xl font-bold text-primary"
                  style={{
                    fontFamily: titleFont,
                    color: titleColor,
                  }}
                >
                  {title}
                </h1>
                <p
                  className="text-xs"
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

          <div className="print-grid-container flex-1 flex flex-col min-h-0">
            <div
              className="print-grid flex-1 grid gap-0.5 bg-gray-50 overflow-visible rounded-md"
              style={{
                gridTemplateColumns: `auto repeat(${numberOfDays}, 1fr)`,
                gridTemplateRows: gridTemplateRowsValue,
              }}
            >
              <div
                className="print-day-header py-2 px-3 text-center font-medium"
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
                  className="print-day-header py-2 px-1 text-center font-medium"
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
                const showTimeLabels = slotPercentage > 7;

                return (
                  <div
                    key={`time-label-${timeIndex}`}
                    className="print-time-cell bg-secondary/30 text-center flex flex-col items-center justify-center font-medium"
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
                      }20`;
                    } else if (subjectToDisplay.color) {
                      cellBackgroundColor = `${subjectToDisplay.color}20`;
                    }
                  }

                  let borderLeftStyle: string | undefined = undefined;
                  if (isMultiSubjectCell) {
                    // Subtle border for multi-subject cells
                  } else if (subjectToDisplay?.subjectType === "break") {
                    borderLeftStyle = undefined;
                  } else if (effectiveColor) {
                    borderLeftStyle = `4px solid ${effectiveColor}`;
                  } else {
                    borderLeftStyle = undefined;
                  }

                  return (
                    <div
                      key={`cell-${dayIndex}-${cellData.timeIndex}`}
                      className={cn(
                        "print-cell relative bg-card border border-border overflow-hidden"
                      )}
                      style={{
                        gridColumn: dayIndex + 2,
                        gridRowStart: cellData.timeIndex + 2,
                        gridRowEnd: `span ${cellData.span}`,
                        backgroundColor: cellBackgroundColor,
                        borderLeft: borderLeftStyle,
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
                                    index < arr.length - 1 ? "border-r" : "",
                                    contentDensity > 2 ? "p-0" : "p-0.5"
                                  )}
                                  style={{
                                    backgroundColor: `${stripEffectiveColor}20`,
                                    borderColor: `${stripEffectiveColor}50`,
                                  }}
                                >
                                  <div className="w-full flex items-center justify-center overflow-hidden">
                                    {hasIcon && stripEffectiveIcon && (
                                      <span className="inline-flex mr-0.5 text-[6px] overflow-hidden flex-nowrap">
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
                                          ? "text-[5px]"
                                          : showTimeLabelsInCell
                                          ? "text-[6px]"
                                          : "text-[5px]"
                                      )}
                                    >
                                      {stripEffectiveAbbreviation ||
                                        stripEffectiveName}
                                    </div>
                                  </div>
                                  <div className="text-[4px] text-muted-foreground/70">
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
                                          <div className="w-2 h-2 overflow-hidden rounded-sm">
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
                                      {hasRoom && (
                                        <div
                                          className={cn(
                                            "flex items-center truncate w-full",
                                            contentDensity > 2
                                              ? "text-[4px]"
                                              : "text-[5px]"
                                          )}
                                        >
                                          <MapPin className="h-1.5 w-1.5 mr-0.5 flex-shrink-0" />
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
                                              ? "text-[4px]"
                                              : "text-[5px]"
                                          )}
                                        >
                                          <Users className="h-1.5 w-1.5 mr-0.5 flex-shrink-0" />
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
                              {(!isBreakType || showTimeLabelsInCell) && (
                                <div className="flex items-center justify-center overflow-hidden">
                                  {effectiveIcon && (
                                    <span className="inline-flex mr-0.5 text-[7px] overflow-hidden flex-nowrap">
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
                                        ? "text-[7px]"
                                        : "text-[6px]",
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
                                    <div className="text-[5px] flex items-center truncate">
                                      <MapPin className="h-2 w-2 mr-0.5 flex-shrink-0" />
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
                                        <div className="text-[5px] flex items-center truncate">
                                          <Users className="h-2 w-2 mr-0.5 flex-shrink-0" />
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
                                <div className="h-full max-w-[20%] flex-shrink-0 flex items-center justify-center p-0.5 overflow-hidden">
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
                                <div className="h-full max-w-[20%] flex-shrink-0 flex items-center justify-center p-0.5 overflow-hidden">
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
                        hasAnyEntryInFirstSlot && (
                          <div className="flex items-center justify-center h-full">
                            <InfoIcon className="h-3 w-3 text-muted-foreground/50" />
                          </div>
                        )
                      )}
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
