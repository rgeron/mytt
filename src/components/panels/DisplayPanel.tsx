"use client";

import { useTimetableStore } from "@/src/lib/store/timetable-store";

export function DisplayPanel() {
  const { title, subtitle, weekType, setTitle, setSubtitle, setWeekType } =
    useTimetableStore();

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Personnalisation de l&apos;affichage</h3>
      <div className="text-sm text-gray-600 mb-4">
        Modifiez l&apos;apparence et les informations générales
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Titre</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border rounded p-2 w-full"
            placeholder="Mon Emploi du Temps"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Sous-titre</label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="border rounded p-2 w-full"
            placeholder="Année scolaire 2023-2024"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Type de semaine
          </label>
          <select
            value={weekType}
            onChange={(e) =>
              setWeekType(e.target.value as "single" | "ab" | "abc")
            }
            className="border rounded p-2 w-full"
          >
            <option value="single">Semaine unique</option>
            <option value="ab">Semaines A/B</option>
            <option value="abc">Semaines A/B/C</option>
          </select>
        </div>
      </div>
    </div>
  );
}
