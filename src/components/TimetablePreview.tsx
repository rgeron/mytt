"use client";

import { useTimetableStore } from "@/lib/store/timetable-store";
import { cn } from "@/lib/utils";
import React, { useMemo } from "react";

export function TimetablePreview() {
  const { title, subtitle, timeSlots, subjects, entries, showSaturday } =
    useTimetableStore();

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
  const findSubject = (subjectId: string) => {
    return subjects.find((subject) => subject.id === subjectId);
  };

  // Day names in French
  const dayNames = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
  // Add Saturday if enabled
  const displayDayNames = showSaturday ? [...dayNames, "Samedi"] : dayNames;
  // Number of days to display
  const numberOfDays = showSaturday ? 6 : 5;

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
              className="flex-1 grid gap-1 bg-gray-50 overflow-hidden rounded-md"
              style={{
                gridTemplateColumns: `auto repeat(${numberOfDays}, 1fr)`,
                gridTemplateRows: `auto ${timeSlotDurations
                  .map(
                    (duration) =>
                      `${Math.max((duration / totalDayMinutes) * 100, 5)}fr`
                  )
                  .join(" ")}`,
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
              {timeSlots.map((timeSlot, timeIndex) => (
                <React.Fragment key={`slot-row-${timeIndex}`}>
                  {/* Time slot label */}
                  <div
                    key={`time-${timeIndex}`}
                    className="bg-secondary/30 p-2 text-center text-xs flex flex-col items-center justify-center font-medium"
                  >
                    <span>{timeSlot.start}</span>
                    <span>{timeSlot.end}</span>
                  </div>

                  {/* Entries for each day */}
                  {Array.from({ length: numberOfDays }).map((_, dayIndex) => {
                    const entry = findEntry(dayIndex, timeIndex);
                    const subject = entry ? findSubject(entry.subjectId) : null;

                    return (
                      <div
                        key={`cell-${dayIndex}-${timeIndex}`}
                        className={cn(
                          "bg-card p-2 border border-border overflow-hidden transition-colors",
                          subject ? "hover:bg-secondary/10" : ""
                        )}
                        style={{
                          backgroundColor: subject
                            ? `${subject.color}15`
                            : undefined,
                          borderLeft: subject
                            ? `4px solid ${subject.color}`
                            : undefined,
                        }}
                      >
                        {subject && (
                          <div className="flex flex-col h-full">
                            <div className="font-semibold text-xs text-foreground truncate">
                              {subject.name}
                            </div>
                            {entry?.room && (
                              <div className="text-xs text-muted-foreground truncate mt-1">
                                <span className="font-medium">Salle:</span>{" "}
                                {entry.room}
                              </div>
                            )}
                            {entry?.teacher && (
                              <div className="text-xs text-muted-foreground truncate">
                                <span className="font-medium">Prof:</span>{" "}
                                {entry.teacher}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
