"use client";

import { useTimetableStore } from "@/src/lib/store/timetable-store";

type TabType = "schedule" | "subjects" | "display" | "slots";

export function ConfigPanel({ activeTab }: { activeTab: TabType }) {
  const {
    title,
    subtitle,
    timeSlots,
    subjects,
    weekType,
    setTitle,
    setSubtitle,
    setWeekType,
  } = useTimetableStore();

  return (
    <div className="flex flex-col gap-4 h-full">
      <h2 className="text-xl font-semibold">MON EMPLOI DU TEMPS</h2>

      {/* Content for each tab */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "schedule" && (
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
                Les modifications des plages horaires seront disponibles dans
                une prochaine version
              </div>
            </div>
          </div>
        )}

        {activeTab === "subjects" && (
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
        )}

        {activeTab === "display" && (
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
                <label className="block text-sm font-medium mb-1">
                  Sous-titre
                </label>
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
                  onChange={(e) => setWeekType(e.target.value as any)}
                  className="border rounded p-2 w-full"
                >
                  <option value="single">Semaine unique</option>
                  <option value="ab">Semaines A/B</option>
                  <option value="abc">Semaines A/B/C</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === "slots" && (
          <div className="space-y-4">
            <h3 className="font-medium">Détails des créneaux</h3>
            <div className="text-sm text-gray-600 mb-4">
              Personnalisez chaque créneau horaire avec ses détails spécifiques
            </div>

            <div className="text-sm text-center text-gray-500 p-6 border border-dashed rounded">
              Sélectionnez d'abord un créneau sur la grille pour le modifier
            </div>
          </div>
        )}
      </div>

      {/* Footer with actions */}
      <div className="pt-4 mt-auto border-t">
        <button className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          Imprimer
        </button>
      </div>
    </div>
  );
}
