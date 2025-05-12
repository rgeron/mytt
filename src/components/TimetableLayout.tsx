"use client";

import { ConfigPanel } from "./ConfigPanel";
import { TimetablePreview } from "./TimetablePreview";

export function TimetableLayout() {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-100">
      {/* Config Panel - 1/4 width on desktop, full width on mobile */}
      <div className="w-full lg:w-1/4 bg-white p-4 shadow-md overflow-y-auto">
        <ConfigPanel />
      </div>

      {/* Timetable Preview - 3/4 width on desktop, full width on mobile */}
      <div className="w-full lg:w-3/4 p-4 flex justify-center items-start overflow-auto">
        <TimetablePreview />
      </div>
    </div>
  );
}
