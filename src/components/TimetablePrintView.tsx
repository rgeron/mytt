"use client";

import { useTimetableStore } from "@/lib/store/timetable-store";
import React from "react";

export function TimetablePrintView() {
  const {
    title,
    subtitle,
    timeSlots,
    weekType,
    globalFont,
    titleFont,
    titleColor,
    globalColor,
    globalBackgroundColor,
  } = useTimetableStore();

  return (
    <div
      id="timetable-preview-print"
      className="w-full h-full bg-white p-4"
      style={{ fontFamily: globalFont, color: globalColor }}
    >
      <div className="text-center mb-4">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: titleFont, color: titleColor }}
        >
          {title}
        </h1>
        <p
          className="text-sm"
          style={{ fontFamily: globalFont, color: globalColor }}
        >
          {subtitle}
        </p>
      </div>

      {/* This will be the printable timetable grid */}
      <div className="grid grid-cols-6 h-[calc(100%-6rem)] border border-gray-200 rounded">
        {/* Header - Days of week */}
        <div
          className="border-b border-r border-gray-300 p-2 font-medium"
          style={{
            backgroundColor: globalBackgroundColor,
            color: globalColor,
          }}
        >
          Horaires
        </div>
        {["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"].map((day) => (
          <div
            key={day}
            className="border-b border-r border-gray-300 p-2 font-medium"
            style={{
              backgroundColor: globalBackgroundColor,
              color: globalColor,
            }}
          >
            {day}
          </div>
        ))}

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
