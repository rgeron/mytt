"use client";

import { useTimetableStore } from "@/src/lib/store/timetable-store";
import React from "react";

export function TimetablePrintView() {
  const { title, subtitle, timeSlots, weekType } = useTimetableStore();

  return (
    <div
      id="timetable-preview"
      className="w-full h-full bg-white p-4 rounded-lg shadow-md border border-gray-200"
    >
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-gray-600">{subtitle}</p>
      </div>

      {/* This will be the printable timetable grid */}
      <div className="grid grid-cols-6 h-[calc(100%-6rem)] border border-gray-200 rounded">
        {/* Header - Days of week */}
        <div className="border-b border-r border-gray-300 bg-gray-50 p-2 font-medium">
          Horaires
        </div>
        <div className="border-b border-r border-gray-300 bg-gray-50 p-2 font-medium">
          Lundi
        </div>
        <div className="border-b border-r border-gray-300 bg-gray-50 p-2 font-medium">
          Mardi
        </div>
        <div className="border-b border-r border-gray-300 bg-gray-50 p-2 font-medium">
          Mercredi
        </div>
        <div className="border-b border-r border-gray-300 bg-gray-50 p-2 font-medium">
          Jeudi
        </div>
        <div className="border-b border-gray-300 bg-gray-50 p-2 font-medium">
          Vendredi
        </div>

        {/* This would be dynamically generated based on timeSlots */}
        {timeSlots.map((slot, index) => (
          <React.Fragment key={`row-${index}`}>
            {/* Time slot */}
            <div className="border-b border-r border-gray-300 p-2 text-sm bg-gray-50">
              {slot.start} - {slot.end}
            </div>

            {/* Empty cells for each day (these would be filled with actual schedule data) */}
            <div className="border-b border-r border-gray-300 p-2 text-sm"></div>
            <div className="border-b border-r border-gray-300 p-2 text-sm"></div>
            <div className="border-b border-r border-gray-300 p-2 text-sm"></div>
            <div className="border-b border-r border-gray-300 p-2 text-sm"></div>
            <div className="border-b border-gray-300 p-2 text-sm"></div>
          </React.Fragment>
        ))}
      </div>

      {/* Week type indicator if not single */}
      {weekType !== "single" && (
        <div className="mt-2 text-right text-sm">
          <span className="font-medium">
            {weekType === "ab" ? "Semaines A/B" : "Semaines A/B/C"}
          </span>
        </div>
      )}
    </div>
  );
}
