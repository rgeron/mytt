"use client";

import { useTimetableStore } from "@/src/lib/store/timetable-store";

export function SchedulePanel() {
  const { timeSlots } = useTimetableStore();

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Configuration des plages horaires</h3>
      <div className="text-sm text-gray-600 mb-4">
        Définissez les plages horaires de votre emploi du temps
      </div>

      <div className="space-y-3">
        {timeSlots.map((slot, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex-1 grid grid-cols-2 gap-2">
              <input
                type="time"
                value={slot.start}
                className="border rounded p-1 w-full"
                disabled
              />
              <input
                type="time"
                value={slot.end}
                className="border rounded p-1 w-full"
                disabled
              />
            </div>
          </div>
        ))}

        <div className="text-xs text-gray-500 mt-2">
          Les modifications des plages horaires seront disponibles dans une
          prochaine version
        </div>
      </div>
    </div>
  );
}
