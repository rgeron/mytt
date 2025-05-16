import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SubjectType = "school" | "extracurricular" | "break";
export type WeekDesignation = "a" | "b" | "c"; // For clarity

export type TimeSlot = {
  start: string;
  end: string;
};

export type Subject = {
  id: string;
  name: string;
  color: string;
  subjectType: SubjectType;
  icon?: string[];
  abbreviation?: string;
  image?: string;
  imagePosition?: "left" | "right";
  teacherOrCoach?: string[];
};

// New type for a sub-entry within a week
export type TimetableSubEntry = {
  subjectId: string;
  room?: string;
  teachers?: string[];
  notes?: string;
};

// Updated TimetableEntry type
export type TimetableEntry = {
  day: number; // 0 = Monday, 1 = Tuesday, etc.
  timeSlotIndex: number;
  weekA?: TimetableSubEntry;
  weekB?: TimetableSubEntry;
  weekC?: TimetableSubEntry;
};

export type SelectedSlotInfo = {
  day: number;
  timeSlotIndex: number;
  // Note: weekDesignation and subjectId might be needed later for more precise targeting
  // For now, the panel will derive context using currentWeekType
};

export type TimetableState = {
  title: string;
  subtitle: string;
  timeSlots: TimeSlot[];
  subjects: Subject[];
  entries: TimetableEntry[]; // Uses updated TimetableEntry
  weekType: "single" | "ab" | "abc";
  currentWeekType: WeekDesignation;
  showSaturday: boolean;
  selectedActivityId: string | null;
  selectedSlotForPanel: SelectedSlotInfo | null; // Added for the slots panel
  isEraserModeActive: boolean; // <-- New state for eraser mode

  // Actions
  setTitle: (title: string) => void;
  setSubtitle: (subtitle: string) => void;
  addTimeSlot: (timeSlot: TimeSlot) => void;
  removeTimeSlot: (index: number) => void;
  addSubject: (subject: Omit<Subject, "id">) => void;
  removeSubject: (id: string) => void;
  updateSubject: (id: string, subject: Partial<Omit<Subject, "id">>) => void;
  addEntry: (
    day: number,
    timeSlotIndex: number,
    week: WeekDesignation,
    subEntry: TimetableSubEntry
  ) => void;
  removeSubEntry: (
    day: number,
    timeSlotIndex: number,
    week: WeekDesignation
  ) => void;
  updateSubEntry: (
    day: number,
    timeSlotIndex: number,
    week: WeekDesignation,
    subEntryUpdates: Partial<TimetableSubEntry>
  ) => void;
  setWeekType: (type: "single" | "ab" | "abc") => void;
  setCurrentWeekType: (type: WeekDesignation) => void;
  setShowSaturday: (show: boolean) => void;
  setSelectedActivityId: (id: string | null) => void;
  setSelectedSlotForPanel: (slotInfo: SelectedSlotInfo | null) => void; // Added setter
  toggleEraserMode: () => void; // <-- New action for eraser mode
  reset: () => void;
};

const defaultTimeSlots: TimeSlot[] = [
  { start: "08:00", end: "09:00" },
  { start: "09:00", end: "10:00" },
  { start: "10:00", end: "11:00" },
  { start: "11:00", end: "12:00" },
  { start: "12:00", end: "13:00" },
  { start: "13:00", end: "14:00" },
  { start: "14:00", end: "15:00" },
  { start: "15:00", end: "16:00" },
  { start: "16:00", end: "17:00" },
  { start: "17:00", end: "18:00" },
];

const defaultSubjects: Subject[] = [
  // School Subjects (at least 10)
  {
    id: uuidv4(),
    name: "Mathématiques",
    color: "#FF5733",
    subjectType: "school",
    abbreviation: "Maths",
    teacherOrCoach: ["M. Pythagore", "Mme. Euclide"],
    icon: ["🧮", "📊", "📐"],
  },
  {
    id: uuidv4(),
    name: "Français",
    color: "#33CFFF",
    subjectType: "school",
    abbreviation: "Français",
    teacherOrCoach: ["Mme. Hugo", "M. Balzac"],
    icon: ["📚", "✍️"],
  },
  {
    id: uuidv4(),
    name: "Histoire-Géographie",
    color: "#FFC300",
    subjectType: "school",
    abbreviation: "Histoire-Géographie",
    icon: ["🌍", "📜"],
  },
  {
    id: uuidv4(),
    name: "Physique-Chimie",
    color: "#DAF7A6",
    subjectType: "school",
    abbreviation: "Physique-Chimie",
    icon: ["⚗️", "🧪", "🔬"],
  },
  {
    id: uuidv4(),
    name: "SVT",
    color: "#4CAF50",
    subjectType: "school",
    abbreviation: "SVT",
    icon: ["🌱", "🧬", "🦠"],
  },
  {
    id: uuidv4(),
    name: "Anglais",
    color: "#FFC0CB",
    subjectType: "school",
    abbreviation: "Anglais",
    icon: ["🇬🇧", "🗣️"],
  },
  {
    id: uuidv4(),
    name: "Espagnol",
    color: "#F4A460",
    subjectType: "school",
    abbreviation: "Espagnol",
    icon: ["🇪🇸", "💃"],
  },
  {
    id: uuidv4(),
    name: "Allemand",
    color: "#A9A9A9",
    subjectType: "school",
    abbreviation: "Allemand",
    icon: ["🇩🇪", "🥨"],
  },
  {
    id: uuidv4(),
    name: "Philosophie",
    color: "#DDA0DD",
    subjectType: "school",
    abbreviation: "Philo",
    icon: ["🤔", "💭"],
  },
  {
    id: uuidv4(),
    name: "EPS",
    color: "#20B2AA",
    subjectType: "school",
    abbreviation: "EPS",
    icon: ["🤸", "🏃", "🏋️"],
  },
  {
    id: uuidv4(),
    name: "Musique (Cours)",
    color: "#FF69B4",
    subjectType: "school",
    abbreviation: "Musique",
    icon: ["🎼", "🎵", "🎹"],
  },
  {
    id: uuidv4(),
    name: "Arts Plastiques",
    color: "#FFA07A",
    subjectType: "school",
    abbreviation: "ArtPlast",
    icon: ["🎨", "🖌️", "🖼️"],
  },

  // Extracurricular Activities (at least 10)
  {
    id: uuidv4(),
    name: "Football",
    color: "#008000",
    subjectType: "extracurricular",
    icon: ["⚽", "🏟️", "🥅"],
  },
  {
    id: uuidv4(),
    name: "Danse",
    color: "#8A2BE2",
    subjectType: "extracurricular",
    icon: ["💃", "🕺", "🩰"],
  },
  {
    id: uuidv4(),
    name: "Piano",
    color: "#000000",
    subjectType: "extracurricular",
    icon: ["🎹", "🎵"],
    teacherOrCoach: ["Mme. Notes"],
  },
  {
    id: uuidv4(),
    name: "Guitare",
    color: "#8B4513",
    subjectType: "extracurricular",
    icon: ["🎸", "🎵"],
  },
  {
    id: uuidv4(),
    name: "Théâtre",
    color: "#FF4500",
    subjectType: "extracurricular",
    icon: ["🎭", "🎬"],
  },
  {
    id: uuidv4(),
    name: "Judo",
    color: "#DC143C",
    subjectType: "extracurricular",
    icon: ["🥋", "🥇"],
  },
  {
    id: uuidv4(),
    name: "Natation",
    color: "#00FFFF",
    subjectType: "extracurricular",
    icon: ["🏊", "🏆", "🏊‍♀️"],
  },
  {
    id: uuidv4(),
    name: "Scoutisme",
    color: "#228B22",
    subjectType: "extracurricular",
    icon: ["🏕️", "🧭", "🔥"],
  },
  {
    id: uuidv4(),
    name: "Club de Lecture",
    color: "#DEB887",
    subjectType: "extracurricular",
    icon: ["📚", "📖", "☕"],
  },
  {
    id: uuidv4(),
    name: "Échecs",
    color: "#556B2F",
    subjectType: "extracurricular",
    icon: ["♟️", "🧠"],
  },
  {
    id: uuidv4(),
    name: "Bénévolat",
    color: "#FF8C00",
    subjectType: "extracurricular",
    icon: ["🤝", "❤️", "🌟"],
  },

  // Breaks
  {
    id: uuidv4(),
    name: "Pause Déjeuner",
    color: "#D3D3D3",
    subjectType: "break",
    icon: ["🥪", "🍽️", "☕"],
  },
  {
    id: uuidv4(),
    name: "Récréation",
    color: "#A9A9A9",
    subjectType: "break",
    icon: ["🤸‍♂️", "⏱️", "🛝"],
  },
  {
    id: uuidv4(),
    name: "Pause",
    color: "#E6E6FA",
    subjectType: "break",
    icon: ["☕", "⏸️", "💤"],
  },
];

const initialState = {
  title: "Mon Emploi du Temps",
  subtitle: "Année scolaire 2023-2024",
  timeSlots: defaultTimeSlots,
  subjects: defaultSubjects,
  entries: [], // Initial entries are empty, will conform to new TimetableEntry structure
  weekType: "single" as const,
  currentWeekType: "a" as WeekDesignation,
  showSaturday: false,
  selectedActivityId: null,
  selectedSlotForPanel: null, // Added initial state for selectedSlotForPanel
  isEraserModeActive: false, // <-- Initialize new state
};

export const useTimetableStore = create<TimetableState>()(
  persist(
    (set) => ({
      ...initialState,

      setTitle: (title) => set({ title }),
      setSubtitle: (subtitle) => set({ subtitle }),
      addTimeSlot: (timeSlot) =>
        set((state) => ({ timeSlots: [...state.timeSlots, timeSlot] })),
      removeTimeSlot: (index) =>
        set((state) => ({
          timeSlots: state.timeSlots.filter((_, i) => i !== index),
        })),
      addSubject: (subjectData) =>
        set((state) => ({
          subjects: [...state.subjects, { ...subjectData, id: uuidv4() }],
        })),
      removeSubject: (id) =>
        set((state) => {
          // First, filter out the subject from the subjects array
          const updatedSubjects = state.subjects.filter(
            (subject) => subject.id !== id
          );

          // Then, filter entries and clean up references to the deleted subject
          const updatedEntries = state.entries
            .map((entry) => {
              // Check each week's subEntry for the subject
              return {
                ...entry,
                weekA:
                  entry.weekA && entry.weekA.subjectId !== id
                    ? entry.weekA
                    : undefined,
                weekB:
                  entry.weekB && entry.weekB.subjectId !== id
                    ? entry.weekB
                    : undefined,
                weekC:
                  entry.weekC && entry.weekC.subjectId !== id
                    ? entry.weekC
                    : undefined,
              };
            })
            .filter((entry) => {
              // Only keep entries that still have at least one week with a valid subject
              return entry.weekA || entry.weekB || entry.weekC;
            });

          // Check if we need to clear the selected panel slot
          let updatedSelectedSlotForPanel = state.selectedSlotForPanel;

          // Clear selected slot panel if it's showing this subject
          if (state.selectedSlotForPanel) {
            const { day, timeSlotIndex } = state.selectedSlotForPanel;
            const slotEntry = updatedEntries.find(
              (e) => e.day === day && e.timeSlotIndex === timeSlotIndex
            );

            // If the entry doesn't exist anymore or has been cleaned up for this subject, clear selection
            if (!slotEntry) {
              updatedSelectedSlotForPanel = null;
            }
          }

          return {
            subjects: updatedSubjects,
            entries: updatedEntries,
            // If the deleted subject was the selected activity, deselect it
            selectedActivityId:
              state.selectedActivityId === id ? null : state.selectedActivityId,
            selectedSlotForPanel: updatedSelectedSlotForPanel,
          };
        }),
      updateSubject: (id, updates) =>
        set((state) => ({
          subjects: state.subjects.map((subject) =>
            subject.id === id ? { ...subject, ...updates } : subject
          ),
        })),

      addEntry: (day, timeSlotIndex, week, subEntry) =>
        set((state) => {
          const entryIndex = state.entries.findIndex(
            (e) => e.day === day && e.timeSlotIndex === timeSlotIndex
          );
          const weekKey = `week${week.toUpperCase()}` as keyof Pick<
            TimetableEntry,
            "weekA" | "weekB" | "weekC"
          >;

          if (entryIndex > -1) {
            // Entry for this slot exists, update it
            const updatedEntries = [...state.entries];
            updatedEntries[entryIndex] = {
              ...updatedEntries[entryIndex],
              [weekKey]: subEntry,
            };
            return { entries: updatedEntries };
          } else {
            // No entry for this slot, create a new one
            const newEntry: TimetableEntry = {
              day,
              timeSlotIndex,
              [weekKey]: subEntry,
            };
            return { entries: [...state.entries, newEntry] };
          }
        }),

      removeSubEntry: (day, timeSlotIndex, week) =>
        set((state) => {
          const entryIndex = state.entries.findIndex(
            (e) => e.day === day && e.timeSlotIndex === timeSlotIndex
          );
          if (entryIndex === -1) return {}; // No entry found

          const updatedEntries = [...state.entries];
          const entryToUpdate = { ...updatedEntries[entryIndex] };
          const weekKey = `week${week.toUpperCase()}` as keyof Pick<
            TimetableEntry,
            "weekA" | "weekB" | "weekC"
          >;

          delete entryToUpdate[weekKey]; // Remove the specific week's sub-entry

          // If all week sub-entries are gone, remove the entire entry
          if (
            !entryToUpdate.weekA &&
            !entryToUpdate.weekB &&
            !entryToUpdate.weekC
          ) {
            updatedEntries.splice(entryIndex, 1);
          } else {
            updatedEntries[entryIndex] = entryToUpdate;
          }
          return { entries: updatedEntries };
        }),

      updateSubEntry: (day, timeSlotIndex, week, subEntryUpdates) =>
        set((state) => {
          const entryIndex = state.entries.findIndex(
            (e) => e.day === day && e.timeSlotIndex === timeSlotIndex
          );
          if (entryIndex === -1) return {}; // No entry found

          const updatedEntries = [...state.entries];
          const entryToUpdate = { ...updatedEntries[entryIndex] };
          const weekKey = `week${week.toUpperCase()}` as keyof Pick<
            TimetableEntry,
            "weekA" | "weekB" | "weekC"
          >;

          if (entryToUpdate[weekKey]) {
            entryToUpdate[weekKey] = {
              ...entryToUpdate[weekKey],
              ...subEntryUpdates,
            };
            updatedEntries[entryIndex] = entryToUpdate;
            return { entries: updatedEntries };
          }
          return {}; // Sub-entry for the week doesn't exist, do nothing (or could create it)
        }),

      setWeekType: (weekType) => set({ weekType }),
      setCurrentWeekType: (currentWeekType) => set({ currentWeekType }),
      setShowSaturday: (showSaturday) => set({ showSaturday }),
      setSelectedActivityId: (id) => set({ selectedActivityId: id }),
      setSelectedSlotForPanel: (slotInfo) =>
        set({ selectedSlotForPanel: slotInfo }),

      toggleEraserMode: () =>
        set((state) => {
          const newEraserModeState = !state.isEraserModeActive;
          return {
            isEraserModeActive: newEraserModeState,
            // If eraser mode is activated, deselect any active subject
            selectedActivityId: newEraserModeState
              ? null
              : state.selectedActivityId,
          };
        }),

      reset: () => set({ ...initialState, entries: [] }), // Ensure entries are reset correctly
    }),
    {
      name: "timetable-storage",
    }
  )
);
