"use client";

import { ConfigPanel } from "./ConfigPanel";
import { TimetablePreview } from "./TimetablePreview";

export function TimetableLayout() {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-100">
      {/* Config Panel - 30% width on desktop, full width on mobile */}
      <div className="w-full lg:w-[30%] bg-white p-4 shadow-md overflow-y-auto">
        <ConfigPanel />
      </div>

      {/* Timetable Preview - 70% width on desktop, full width on mobile */}
      <div className="w-full lg:w-[70%] p-2 flex justify-center items-center overflow-auto h-screen">
        <TimetablePreview />
      </div>
    </div>
  );
}
