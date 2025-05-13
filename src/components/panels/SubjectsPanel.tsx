"use client";

import { useTimetableStore } from "@/src/lib/store/timetable-store";

export function SubjectsPanel() {
  const { subjects } = useTimetableStore();

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Gestion des matières</h3>
      <div className="text-sm text-gray-600 mb-4">
        Ajoutez et configurez les matières de votre emploi du temps
      </div>

      <div className="mb-3">
        {subjects.length === 0 ? (
          <div className="text-sm text-gray-500 p-4 border border-dashed rounded-md text-center">
            Aucune matière configurée pour le moment
          </div>
        ) : (
          <div className="space-y-2">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                className="p-2 border rounded-md flex items-center"
                style={{
                  borderLeftColor: subject.color,
                  borderLeftWidth: "4px",
                }}
              >
                <div className="flex-1">
                  <div className="font-medium">{subject.name}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="w-full p-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors">
        Ajouter une matière
      </button>
    </div>
  );
}
