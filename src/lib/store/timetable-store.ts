import { create } from "zustand";
import { persist } from "zustand/middleware";

type TimeSlot = {
  start: string;
  end: string;
};

type Subject = {
  id: string;
  name: string;
  color: string;
};

type TimetableEntry = {
  day: number; // 0 = Monday, 1 = Tuesday, etc.
  timeSlotIndex: number;
  subjectId: string;
  room?: string;
  teacher?: string;
  notes?: string;
};

type TimetableState = {
  title: string;
  subtitle: string;
  timeSlots: TimeSlot[];
  subjects: Subject[];
  entries: TimetableEntry[];
  weekType: "single" | "ab" | "abc";
  currentWeekType: "a" | "b" | "c";

  // Actions
  setTitle: (title: string) => void;
  setSubtitle: (subtitle: string) => void;
  addTimeSlot: (timeSlot: TimeSlot) => void;
  removeTimeSlot: (index: number) => void;
  addSubject: (subject: Subject) => void;
  removeSubject: (id: string) => void;
  updateSubject: (id: string, subject: Partial<Subject>) => void;
  addEntry: (entry: TimetableEntry) => void;
  removeEntry: (day: number, timeSlotIndex: number) => void;
  updateEntry: (
    day: number,
    timeSlotIndex: number,
    entry: Partial<TimetableEntry>
  ) => void;
  setWeekType: (type: "single" | "ab" | "abc") => void;
  setCurrentWeekType: (type: "a" | "b" | "c") => void;
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
];

const initialState = {
  title: "Mon Emploi du Temps",
  subtitle: "Année scolaire 2023-2024",
  timeSlots: defaultTimeSlots,
  subjects: [],
  entries: [],
  weekType: "single" as const,
  currentWeekType: "a" as const,
};

export const useTimetableStore = create<TimetableState>()(
  persist(
    (set) => ({
      ...initialState,

      setTitle: (title) => set({ title }),
      setSubtitle: (subtitle) => set({ subtitle }),

      addTimeSlot: (timeSlot) =>
        set((state) => ({
          timeSlots: [...state.timeSlots, timeSlot],
        })),

      removeTimeSlot: (index) =>
        set((state) => ({
          timeSlots: state.timeSlots.filter((_, i) => i !== index),
        })),

      addSubject: (subject) =>
        set((state) => ({
          subjects: [...state.subjects, subject],
        })),

      removeSubject: (id) =>
        set((state) => ({
          subjects: state.subjects.filter((subject) => subject.id !== id),
        })),

      updateSubject: (id, updates) =>
        set((state) => ({
          subjects: state.subjects.map((subject) =>
            subject.id === id ? { ...subject, ...updates } : subject
          ),
        })),

      addEntry: (entry) =>
        set((state) => ({
          entries: [...state.entries, entry],
        })),

      removeEntry: (day, timeSlotIndex) =>
        set((state) => ({
          entries: state.entries.filter(
            (entry) =>
              !(entry.day === day && entry.timeSlotIndex === timeSlotIndex)
          ),
        })),

      updateEntry: (day, timeSlotIndex, updates) =>
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.day === day && entry.timeSlotIndex === timeSlotIndex
              ? { ...entry, ...updates }
              : entry
          ),
        })),

      setWeekType: (weekType) => set({ weekType }),
      setCurrentWeekType: (currentWeekType) => set({ currentWeekType }),

      reset: () => set(initialState),
    }),
    {
      name: "timetable-storage", // Name for localStorage key
    }
  )
);
