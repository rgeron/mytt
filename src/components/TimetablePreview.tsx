"use client";

import { useTimetableStore } from "@/src/lib/store/timetable-store";

export function TimetablePreview() {
  const { title, subtitle, timeSlots, subjects, entries } = useTimetableStore();

  // A4 paper dimensions in pixels (assuming 96 DPI)
  // A4 is 297mm × 210mm - We'll simulate these dimensions
  // For landscape mode, we swap width and height: 297mm × 210mm

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
    <div className="relative">
      {/* A4 Paper Preview - Landscape orientation */}
      <div
        className="bg-white shadow-lg border border-gray-300 overflow-hidden"
        style={{
          // A4 aspect ratio for landscape orientation (1.414:1)
          width: "min(100%, 1123px)", // 297mm at 96 DPI = ~1123px
          height: "min(100%, 794px)", // 210mm at 96 DPI = ~794px
          aspectRatio: "1.414/1",
          margin: "0 auto",
        }}
      >
        {/* Timetable content */}
        <div className="h-full w-full p-8 flex flex-col">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-gray-600">{subtitle}</p>
          </div>

          {/* Timetable grid */}
          <div
            className="flex-1 grid gap-1 bg-gray-100"
            style={{
              gridTemplateColumns: "auto repeat(5, 1fr)",
              gridTemplateRows: `auto repeat(${timeSlots.length}, 1fr)`,
            }}
          >
            {/* Header: Time column */}
            <div className="bg-blue-600 text-white p-2 text-center">
              Horaires
            </div>

            {/* Header: Day columns */}
            {dayNames.map((day, index) => (
              <div
                key={`day-${index}`}
                className="bg-blue-600 text-white p-2 text-center"
              >
                {day}
              </div>
            ))}

            {/* Time slots and entries */}
            {timeSlots.map((timeSlot, timeIndex) => (
              <>
                {/* Time slot label */}
                <div
                  key={`time-${timeIndex}`}
                  className="bg-gray-200 p-1 text-center text-sm"
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
                      className="bg-white p-1 border min-h-12"
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
                          <div className="font-semibold text-sm">
                            {subject.name}
                          </div>
                          {entry?.room && (
                            <div className="text-xs">Salle: {entry.room}</div>
                          )}
                          {entry?.teacher && (
                            <div className="text-xs">Prof: {entry.teacher}</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>
      </div>

      {/* Print info note */}
      <div className="mt-4 text-sm text-gray-600 text-center">
        Format A4 Paysage (297mm × 210mm)
      </div>
    </div>
  );
}
