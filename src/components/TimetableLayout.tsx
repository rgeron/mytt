"use client";

import { useState } from "react";
import { ConfigPanel, TabType } from "./ConfigPanel";
import { TabsBar } from "./TabsBar";
import { TimetablePreview } from "./TimetablePreview";

export function TimetableLayout() {
  const [activeTab, setActiveTab] = useState<TabType>("schedule");

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-100 overflow-hidden">
      {/* Config Panel - 30% width on desktop, full width on mobile */}
      <div className="w-full lg:w-[30%] bg-white p-4 shadow-md h-full overflow-hidden">
        <ConfigPanel activeTab={activeTab} />
      </div>

      {/* Timetable Preview with Tabs Bar - 70% width on desktop, full width on mobile */}
      <div className="w-full lg:w-[70%] flex flex-col h-full overflow-hidden">
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
