"use client";

import { PrinterIcon } from "lucide-react";
import { useEffect } from "react";
import { DisplayPanel } from "./panels/DisplayPanel";
import { SchedulePanel } from "./panels/SchedulePanel";
import { SlotsPanel } from "./panels/SlotsPanel";
import { SubjectsPanel } from "./panels/SubjectsPanel";
import { TimetablePrintView } from "./TimetablePrintView";

export type TabType = "schedule" | "subjects" | "display" | "slots";

export function ConfigPanel({ activeTab }: { activeTab: TabType }) {
  // Add print stylesheet
  useEffect(() => {
    // Create a style element for print media
    const style = document.createElement("style");
    style.id = "print-styles";
    style.media = "print";
    style.innerHTML = `
      @page {
        size: A4 landscape;
        margin: 0.5cm;
      }
      
      @media print {
        html, body {
          width: 29.7cm;
          height: 21cm;
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
        
        body * {
          visibility: hidden;
        }
        
        #timetable-preview, #timetable-preview * {
          visibility: visible;
        }
        
        #timetable-preview {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          height: 100% !important;
          box-shadow: none !important;
          border: none !important;
        }
        
        .no-print {
          display: none !important;
        }
      }
    `;

    // Add it to the document if it doesn't exist yet
    if (!document.getElementById("print-styles")) {
      document.head.appendChild(style);
    }

    // Clean up when component unmounts
    return () => {
      const existingStyle = document.getElementById("print-styles");
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  const handlePrint = () => {
    // Use browser's print functionality with our print styles
    window.print();
  };

  return (
    <>
      <div className="flex flex-col h-full no-print">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">MON EMPLOI DU TEMPS</h2>
          <button
            onClick={handlePrint}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Imprimer"
          >
            <PrinterIcon className="size-5" />
          </button>
        </div>

        {/* Content for each tab - made scrollable */}
        <div className="flex-1 overflow-y-auto mt-4 pr-2">
          {activeTab === "schedule" && <SchedulePanel />}
          {activeTab === "subjects" && <SubjectsPanel />}
          {activeTab === "display" && <DisplayPanel />}
          {activeTab === "slots" && <SlotsPanel />}
        </div>
      </div>

      {/* Printable view that will only be visible when printing */}
      <div className="hidden">
        <TimetablePrintView />
      </div>
    </>
  );
}
