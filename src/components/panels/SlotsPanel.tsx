"use client";

export function SlotsPanel() {
  return (
    <div className="space-y-4">
      <h3 className="font-medium">Détails des créneaux</h3>
      <div className="text-sm text-gray-600 mb-4">
        Personnalisez chaque créneau horaire avec ses détails spécifiques
      </div>

      <div className="text-sm text-center text-gray-500 p-6 border border-dashed rounded">
        Sélectionnez d&apos;abord un créneau sur la grille pour le modifier
      </div>
    </div>
  );
}
