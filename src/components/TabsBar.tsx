"use client";

type TabType = "schedule" | "subjects" | "display" | "slots";

export function TabsBar({
  activeTab,
  setActiveTab,
}: {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}) {
  return (
    <div className="bg-white shadow-sm rounded-t-md border-b border-gray-200">
      <div className="flex">
        <button
          className={`py-2 px-4 ${
            activeTab === "schedule"
              ? "border-b-2 border-blue-600 font-medium text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
          onClick={() => setActiveTab("schedule")}
        >
          1. Horaires
        </button>
        <button
          className={`py-2 px-4 ${
            activeTab === "subjects"
              ? "border-b-2 border-blue-600 font-medium text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
          onClick={() => setActiveTab("subjects")}
        >
          2. Matières
        </button>
        <button
          className={`py-2 px-4 ${
            activeTab === "display"
              ? "border-b-2 border-blue-600 font-medium text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
          onClick={() => setActiveTab("display")}
        >
          3. Affichage
        </button>
        <button
          className={`py-2 px-4 ${
            activeTab === "slots"
              ? "border-b-2 border-blue-600 font-medium text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
          onClick={() => setActiveTab("slots")}
        >
          4. Détails
        </button>
      </div>
    </div>
  );
}
