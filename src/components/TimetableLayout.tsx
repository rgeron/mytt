"use client";

import { useState } from "react";
import { ConfigPanel } from "./ConfigPanel";
import { TabsBar } from "./TabsBar";
import { TimetablePreview } from "./TimetablePreview";

type TabType = "schedule" | "subjects" | "display" | "slots";

export function TimetableLayout() {
  const [activeTab, setActiveTab] = useState<TabType>("schedule");

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-100">
      {/* Config Panel - 30% width on desktop, full width on mobile */}
      <div className="w-full lg:w-[30%] bg-white p-4 shadow-md overflow-y-auto">
        <ConfigPanel activeTab={activeTab} />
      </div>

      {/* Timetable Preview with Tabs Bar - 70% width on desktop, full width on mobile */}
      <div className="w-full lg:w-[70%] flex flex-col">
        {/* Tabs Bar */}
        <div className="p-2 bg-gray-100">
          <TabsBar activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        {/* Timetable Preview */}
        <div className="p-2 flex-1 flex justify-center items-center overflow-auto">
          <TimetablePreview />
        </div>
      </div>
    </div>
  );
}
