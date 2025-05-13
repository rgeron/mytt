"use client";

import { useTimetableStore } from "@/lib/store/timetable-store";
import React, { useMemo } from "react";

export function TimetablePreview() {
  const { title, subtitle, timeSlots, subjects, entries } = useTimetableStore();

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

  return (
    <div className="relative h-full w-full flex flex-col justify-center">
      {/* A4 Paper Preview - Landscape orientation */}
      <div
        id="timetable-preview"
        className="bg-white shadow-lg border border-gray-300 overflow-hidden"
        style={{
          // A4 aspect ratio for landscape orientation (1.414:1)
          width: "98%", // Take up almost all of the container width
          height: "auto", // Height will be determined by aspect ratio
          aspectRatio: "1.414/1",
          margin: "0 auto",
          maxHeight: "95vh", // Limit height to avoid overflow
        }}
      >
        {/* Timetable content */}
        <div className="h-full w-full p-4 flex flex-col">
          <div className="text-center mb-3">
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-gray-600">{subtitle}</p>
          </div>

          {/* Timetable grid container - uses flex-1 to take remaining space */}
          <div className="flex-1 flex flex-col">
            {/* Timetable grid */}
            <div
              className="flex-1 grid gap-1 bg-gray-100 overflow-hidden"
              style={{
                gridTemplateColumns: "auto repeat(5, 1fr)",
                gridTemplateRows: `auto ${timeSlotDurations
                  .map(
                    (duration) =>
                      `${Math.max((duration / totalDayMinutes) * 100, 5)}fr`
                  )
                  .join(" ")}`,
              }}
            >
              {/* Header: Time column */}
              <div className="bg-blue-600 text-white p-1 text-center text-sm">
                Horaires
              </div>

              {/* Header: Day columns */}
              {dayNames.map((day, index) => (
                <div
                  key={`day-${index}`}
                  className="bg-blue-600 text-white p-1 text-center text-sm"
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
                    className="bg-gray-200 p-1 text-center text-xs flex items-center justify-center"
                  >
                    {timeSlot.start} - {timeSlot.end}
                  </div>

                  {/* Entries for each day */}
                  {Array.from({ length: 5 }).map((_, dayIndex) => {
                    const entry = findEntry(dayIndex, timeIndex);
                    const subject = entry ? findSubject(entry.subjectId) : null;

                    return (
                      <div
                        key={`cell-${dayIndex}-${timeIndex}`}
                        className="bg-white p-1 border overflow-hidden"
                        style={{
                          backgroundColor: subject
                            ? `${subject.color}20`
                            : "white",
                          borderLeft: subject
                            ? `4px solid ${subject.color}`
                            : undefined,
                        }}
                      >
                        {subject && (
                          <div className="flex flex-col h-full">
                            <div className="font-semibold text-xs truncate">
                              {subject.name}
                            </div>
                            {entry?.room && (
                              <div className="text-xs truncate">
                                Salle: {entry.room}
                              </div>
                            )}
                            {entry?.teacher && (
                              <div className="text-xs truncate">
                                Prof: {entry.teacher}
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
