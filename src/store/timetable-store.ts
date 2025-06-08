import type {
  SelectedSlotInfo,
  Subject,
  TimeSlot,
  TimetableEntry,
  TimetableSubEntry,
  WeekDesignation,
} from "@/schemas/timetable-schema";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// === STORE STATE TYPE ===
export type TimetableState = {
  title: string;
  subtitle: string;
  timeSlots: TimeSlot[];
  subjects: Subject[];
  entries: TimetableEntry[];
  weekType: "single" | "ab" | "abc";
  currentWeekType: WeekDesignation;
  showSaturday: boolean;
  selectedActivityId: string | null;
  selectedSlotForPanel: SelectedSlotInfo | null;
  isEraserModeActive: boolean;

  // Display options
  globalFont: string;
  titleFont: string;
  titleColor: string;
  globalBackgroundColor: string;
  globalColor: string;
  backgroundImageUrl: string | null;

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
  setSelectedSlotForPanel: (slotInfo: SelectedSlotInfo | null) => void;
  toggleEraserMode: () => void;
  reset: () => void;
  setGlobalFont: (font: string) => void;
  setTitleFont: (font: string) => void;
  setTitleColor: (color: string) => void;
  setGlobalColor: (color: string) => void;
  setGlobalBackgroundColor: (color: string) => void;
  setBackgroundImageUrl: (url: string | null) => void;
};

// === DEFAULT DATA ===
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
  // School Subjects
  {
    id: uuidv4(),
    name: "Mathématiques",
    color: "#FF5733",
    subjectType: "school",
    abbreviation: undefined,
    teacherOrCoach: [],
    icon: ["🧮"],
  },
  {
    id: uuidv4(),
    name: "Français",
    color: "#33CFFF",
    subjectType: "school",
    abbreviation: undefined,
    teacherOrCoach: [],
    icon: ["📚"],
  },
  {
    id: uuidv4(),
    name: "Histoire-Géographie",
    color: "#FFC300",
    subjectType: "school",
    abbreviation: undefined,
    icon: ["🌍"],
    teacherOrCoach: [],
  },
  {
    id: uuidv4(),
    name: "Physique-Chimie",
    color: "#DAF7A6",
    subjectType: "school",
    abbreviation: undefined,
    icon: ["⚗️"],
    teacherOrCoach: [],
  },
  {
    id: uuidv4(),
    name: "SVT",
    color: "#4CAF50",
    subjectType: "school",
    abbreviation: undefined,
    icon: ["🌱"],
    teacherOrCoach: [],
  },
  {
    id: uuidv4(),
    name: "Anglais",
    color: "#FFC0CB",
    subjectType: "school",
    abbreviation: undefined,
    icon: ["🇬🇧"],
    teacherOrCoach: [],
  },
  {
    id: uuidv4(),
    name: "Espagnol",
    color: "#F4A460",
    subjectType: "school",
    abbreviation: undefined,
    icon: ["🇪🇸"],
    teacherOrCoach: [],
  },
  {
    id: uuidv4(),
    name: "Allemand",
    color: "#A9A9A9",
    subjectType: "school",
    abbreviation: undefined,
    icon: ["🇩🇪"],
    teacherOrCoach: [],
  },
  {
    id: uuidv4(),
    name: "Philosophie",
    color: "#DDA0DD",
    subjectType: "school",
    abbreviation: undefined,
    icon: ["🤔"],
    teacherOrCoach: [],
  },
  {
    id: uuidv4(),
    name: "EPS",
    color: "#20B2AA",
    subjectType: "school",
    abbreviation: undefined,
    icon: ["🤸"],
    teacherOrCoach: [],
  },
  {
    id: uuidv4(),
    name: "Musique (Cours)",
    color: "#FF69B4",
    subjectType: "school",
    abbreviation: undefined,
    icon: ["🎼"],
    teacherOrCoach: [],
  },
  {
    id: uuidv4(),
    name: "Arts Plastiques",
    color: "#FFA07A",
    subjectType: "school",
    abbreviation: undefined,
    icon: ["🎨"],
    teacherOrCoach: [],
  },

  // Extracurricular Activities
  {
    id: uuidv4(),
    name: "Football",
    color: "#008000",
    subjectType: "extracurricular",
    icon: ["⚽"],
    abbreviation: undefined,
    teacherOrCoach: [],
  },
  {
    id: uuidv4(),
    name: "Basketball",
    color: "#FF6347",
    subjectType: "extracurricular",
    icon: ["🏀"],
    abbreviation: undefined,
    teacherOrCoach: [],
  },
  {
    id: uuidv4(),
    name: "Danse",
    color: "#8A2BE2",
    subjectType: "extracurricular",
    icon: ["💃"],
    abbreviation: undefined,
    teacherOrCoach: [],
  },
  {
    id: uuidv4(),
    name: "Piano",
    color: "#000000",
    subjectType: "extracurricular",
    icon: ["🎹"],
    teacherOrCoach: [],
    abbreviation: undefined,
  },
  {
    id: uuidv4(),
    name: "Guitare",
    color: "#8B4513",
    subjectType: "extracurricular",
    icon: ["🎸"],
    abbreviation: undefined,
    teacherOrCoach: [],
  },
  {
    id: uuidv4(),
    name: "Théâtre",
    color: "#FF4500",
    subjectType: "extracurricular",
    icon: ["🎭"],
    abbreviation: undefined,
    teacherOrCoach: [],
  },
  {
    id: uuidv4(),
    name: "Judo",
    color: "#DC143C",
    subjectType: "extracurricular",
    icon: ["🥋"],
    abbreviation: undefined,
    teacherOrCoach: [],
  },
  {
    id: uuidv4(),
    name: "Natation",
    color: "#00FFFF",
    subjectType: "extracurricular",
    icon: ["🏊"],
    abbreviation: undefined,
    teacherOrCoach: [],
  },
  {
    id: uuidv4(),
    name: "Scoutisme",
    color: "#228B22",
    subjectType: "extracurricular",
    icon: ["🏕️"],
    abbreviation: undefined,
    teacherOrCoach: [],
  },
  {
    id: uuidv4(),
    name: "Club de Lecture",
    color: "#DEB887",
    subjectType: "extracurricular",
    icon: ["📚"],
    abbreviation: undefined,
    teacherOrCoach: [],
  },
  {
    id: uuidv4(),
    name: "Échecs",
    color: "#556B2F",
    subjectType: "extracurricular",
    icon: ["♟️"],
    abbreviation: undefined,
    teacherOrCoach: [],
  },
  {
    id: uuidv4(),
    name: "Bénévolat",
    color: "#FF8C00",
    subjectType: "extracurricular",
    icon: ["🤝"],
    abbreviation: undefined,
    teacherOrCoach: [],
  },

  // Breaks
  {
    id: uuidv4(),
    name: "Pause Déjeuner",
    color: "#D3D3D3",
    subjectType: "break",
    icon: ["🥪"],
    abbreviation: undefined,
    teacherOrCoach: [],
  },
  {
    id: uuidv4(),
    name: "Récréation",
    color: "#A9A9A9",
    subjectType: "break",
    icon: ["🤸‍♂️"],
    abbreviation: undefined,
    teacherOrCoach: [],
  },
  {
    id: uuidv4(),
    name: "Pause",
    color: "#E6E6FA",
    subjectType: "break",
    icon: ["☕"],
    abbreviation: undefined,
    teacherOrCoach: [],
  },
];

const initialState = {
  title: "Mon Emploi du Temps",
  subtitle: "",
  timeSlots: defaultTimeSlots,
  subjects: defaultSubjects,
  entries: [],
  weekType: "single" as const,
  currentWeekType: "a" as WeekDesignation,
  showSaturday: false,
  selectedActivityId: null,
  selectedSlotForPanel: null,
  isEraserModeActive: false,
  globalFont: "Arial",
  titleFont: "Arial",
  titleColor: "#000000",
  globalBackgroundColor: "#F3F4F6",
  globalColor: "#000000",
  backgroundImageUrl: null,
};

// === STORE IMPLEMENTATION ===
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
          const updatedSubjects = state.subjects.filter(
            (subject) => subject.id !== id
          );

          const updatedEntries = state.entries
            .map((entry) => {
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
              return entry.weekA || entry.weekB || entry.weekC;
            });

          let updatedSelectedSlotForPanel = state.selectedSlotForPanel;

          if (state.selectedSlotForPanel) {
            const { day, timeSlotIndex } = state.selectedSlotForPanel;
            const slotEntry = updatedEntries.find(
              (e) => e.day === day && e.timeSlotIndex === timeSlotIndex
            );

            if (!slotEntry) {
              updatedSelectedSlotForPanel = null;
            }
          }

          return {
            subjects: updatedSubjects,
            entries: updatedEntries,
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
            const updatedEntries = [...state.entries];
            updatedEntries[entryIndex] = {
              ...updatedEntries[entryIndex],
              [weekKey]: subEntry,
            };
            return { entries: updatedEntries };
          } else {
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
          if (entryIndex === -1) return {};

          const updatedEntries = [...state.entries];
          const entryToUpdate = { ...updatedEntries[entryIndex] };
          const weekKey = `week${week.toUpperCase()}` as keyof Pick<
            TimetableEntry,
            "weekA" | "weekB" | "weekC"
          >;

          delete entryToUpdate[weekKey];

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
          if (entryIndex === -1) return {};

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
          return {};
        }),

      setWeekType: (weekType) => set({ weekType }),
      setCurrentWeekType: (currentWeekType) => set({ currentWeekType }),
      setShowSaturday: (showSaturday) => set({ showSaturday }),
      setSelectedActivityId: (id) =>
        set((state) => ({
          selectedActivityId: id,
          isEraserModeActive: id ? false : state.isEraserModeActive,
        })),
      setSelectedSlotForPanel: (slotInfo) =>
        set({ selectedSlotForPanel: slotInfo }),

      toggleEraserMode: () =>
        set((state) => {
          const newEraserModeState = !state.isEraserModeActive;
          return {
            isEraserModeActive: newEraserModeState,
            selectedActivityId: newEraserModeState
              ? null
              : state.selectedActivityId,
          };
        }),

      reset: () => {
        set({ ...initialState, entries: [] });
        console.log("Timetable reset to initial state.");
      },

      setGlobalFont: (font) =>
        set((state) => {
          if (state.titleFont === state.globalFont) {
            return { globalFont: font, titleFont: font };
          }
          return { globalFont: font };
        }),
      setTitleFont: (font) => set({ titleFont: font }),
      setTitleColor: (color) => set({ titleColor: color }),
      setGlobalColor: (color) => set({ globalColor: color }),
      setGlobalBackgroundColor: (color) =>
        set({ globalBackgroundColor: color }),
      setBackgroundImageUrl: (url) => set({ backgroundImageUrl: url }),
    }),
    {
      name: "timetable-storage",
    }
  )
);
