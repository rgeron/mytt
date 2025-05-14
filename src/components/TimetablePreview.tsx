"use client";

import { useTimetableStore, type Subject } from "@/lib/store/timetable-store";
import { cn } from "@/lib/utils";
import { Trash2Icon } from "lucide-react";
import React, { useMemo } from "react";

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
    removeEntry,
  } = useTimetableStore();

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
  const findEntry = (day: number, timeSlotIndex: number) => {
    return entries.find(
      (entry) => entry.day === day && entry.timeSlotIndex === timeSlotIndex
    );
  };

  // Function to find a subject by ID
  const findSubject = (subjectId: string): Subject | undefined => {
    return subjects.find((subject) => subject.id === subjectId);
  };

  const handleCellClick = (dayIndex: number, timeSlotIndex: number) => {
    if (selectedActivityId) {
      const subjectExists = subjects.some((s) => s.id === selectedActivityId);
      if (subjectExists) {
        const existingEntry = findEntry(dayIndex, timeSlotIndex);
        if (
          !(existingEntry && existingEntry.subjectId === selectedActivityId)
        ) {
          addEntry({
            day: dayIndex,
            timeSlotIndex: timeSlotIndex,
            subjectId: selectedActivityId,
          });
        }
        // If it's the same subject, clicking the main cell won't remove it.
        // Removal is handled by the new eraser icon.
      } else {
        console.warn("Selected activity ID does not exist in subjects list.");
      }
    }
  };

  const handleRemoveEntry = (
    e: React.MouseEvent,
    dayIndex: number,
    timeSlotIndex: number
  ) => {
    e.stopPropagation(); // Prevent cell click from firing
    removeEntry(dayIndex, timeSlotIndex);
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
                      const entry = findEntry(dayIndex, timeIndex);
                      const subject = entry
                        ? findSubject(entry.subjectId)
                        : null;

                      return (
                        <div
                          key={`cell-${dayIndex}-${timeIndex}`}
                          className={cn(
                            "relative bg-card border border-border overflow-hidden transition-colors cursor-pointer group",
                            subject
                              ? "hover:bg-secondary/10"
                              : "hover:bg-muted/20"
                          )}
                          style={{
                            backgroundColor: subject
                              ? `${subject.color}20`
                              : undefined,
                            borderLeft: subject
                              ? `4px solid ${subject.color}`
                              : selectedActivityId &&
                                findSubject(selectedActivityId)
                              ? `4px dashed ${
                                  findSubject(selectedActivityId)?.color ||
                                  "transparent"
                                }`
                              : undefined,
                          }}
                          onClick={() => handleCellClick(dayIndex, timeIndex)}
                        >
                          {subject && (
                            <>
                              <div
                                className={cn(
                                  "flex flex-col h-full justify-center",
                                  showTimeLabels ? "p-2" : "p-0"
                                )}
                              >
                                <div className="font-semibold text-xs text-foreground truncate">
                                  {subject.name}
                                </div>
                                {entry?.room && showTimeLabels && (
                                  <div className="text-xs text-muted-foreground truncate mt-1">
                                    <span className="font-medium">Salle:</span>{" "}
                                    {entry.room}
                                  </div>
                                )}
                                {entry?.teacher && showTimeLabels && (
                                  <div className="text-xs text-muted-foreground truncate">
                                    <span className="font-medium">Prof:</span>{" "}
                                    {entry.teacher}
                                  </div>
                                )}
                              </div>
                              <button
                                title="Supprimer l'entrée"
                                onClick={(e) =>
                                  handleRemoveEntry(e, dayIndex, timeIndex)
                                }
                                className="absolute top-0.5 right-0.5 p-0.5 bg-card/50 hover:bg-destructive/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                              >
                                <Trash2Icon className="h-3.5 w-3.5 text-destructive/80 hover:text-destructive" />
                              </button>
                            </>
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
    </div>
  );
}
