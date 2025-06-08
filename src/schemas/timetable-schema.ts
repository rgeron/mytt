import { z } from "zod";

// Time format validator (HH:MM)
const timeFormatRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;

// === BASE TYPES ===
export type SubjectType = "school" | "extracurricular" | "break";
export type WeekDesignation = "a" | "b" | "c";

// === ZOD SCHEMAS ===
export const TimeSlotSchema = z
  .object({
    start: z
      .string()
      .regex(
        timeFormatRegex,
        "Format d'heure invalide. Utilisez le format HH:MM"
      ),
    end: z
      .string()
      .regex(
        timeFormatRegex,
        "Format d'heure invalide. Utilisez le format HH:MM"
      ),
  })
  .refine(
    (data) => {
      // Validate that end time is after start time
      const [startHour, startMinute] = data.start.split(":").map(Number);
      const [endHour, endMinute] = data.end.split(":").map(Number);

      const startTotalMinutes = startHour * 60 + startMinute;
      const endTotalMinutes = endHour * 60 + endMinute;

      return endTotalMinutes > startTotalMinutes;
    },
    {
      message: "L'heure de fin doit être postérieure à l'heure de début",
      path: ["end"],
    }
  );

export const SubjectSchema = z.object({
  id: z.string().uuid({ message: "ID invalide" }).or(z.string().min(1)),
  name: z.string().min(1, "Le nom de la matière est requis"),
  color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Format de couleur invalide"),
  subjectType: z.enum(["school", "extracurricular", "break"], {
    required_error: "Le type d'activité est requis",
  }),
  icon: z.array(z.string()).optional(),
  abbreviation: z.string().optional(),
  image: z.string().url({ message: "URL d'image invalide" }).optional(),
  imagePosition: z.enum(["left", "right"]).optional(),
  teacherOrCoach: z.array(z.string()).optional(),
});

export const TimetableSubEntrySchema = z.object({
  subjectId: z.string().min(1, "ID de matière requis pour le sous-créneau"),
  room: z.string().optional(),
  teachers: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const TimetableEntrySchema = z
  .object({
    day: z.number().min(0).max(6, "Jour invalide"),
    timeSlotIndex: z.number().min(0, "Index de créneau horaire invalide"),
    weekA: TimetableSubEntrySchema.optional(),
    weekB: TimetableSubEntrySchema.optional(),
    weekC: TimetableSubEntrySchema.optional(),
  })
  .refine((data) => data.weekA || data.weekB || data.weekC, {
    message: "Au moins un créneau hebdomadaire (A, B, ou C) doit être défini",
  });

export const SelectedSlotInfoSchema = z.object({
  day: z.number().min(0).max(6),
  timeSlotIndex: z.number().min(0),
});

export const TimetableConfigSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  subtitle: z.string().optional(),
  timeSlots: z.array(TimeSlotSchema),
  subjects: z.array(SubjectSchema),
  entries: z.array(TimetableEntrySchema),
  weekType: z.enum(["single", "ab", "abc"], {
    required_error: "Le type de semaine是 requis",
  }),
  currentWeekType: z.enum(["a", "b", "c"], {
    required_error: "Le type de semaine actuel est requis",
  }),
  showSaturday: z.boolean().optional().default(false),
  selectedActivityId: z.string().nullable().optional(),
  selectedSlotForPanel: SelectedSlotInfoSchema.nullable().optional(),
  isEraserModeActive: z.boolean().optional().default(false),
  globalFont: z.string().optional().default("Arial"),
  titleFont: z.string().optional().default("Arial"),
  titleColor: z.string().optional().default("#000000"),
  globalBackgroundColor: z.string().optional().default("#F3F4F6"),
  globalColor: z.string().optional().default("#000000"),
  backgroundImageUrl: z.string().url().nullable().optional(),
});

// === INFERRED TYPES ===
export type TimeSlot = z.infer<typeof TimeSlotSchema>;
export type Subject = z.infer<typeof SubjectSchema>;
export type TimetableSubEntry = z.infer<typeof TimetableSubEntrySchema>;
export type TimetableEntry = z.infer<typeof TimetableEntrySchema>;
export type SelectedSlotInfo = z.infer<typeof SelectedSlotInfoSchema>;
export type TimetableConfig = z.infer<typeof TimetableConfigSchema>;

// === DISPLAY INTERFACES ===
export interface DayDisplayCell {
  timeIndex: number;
  span: number;
  subjectToDisplay: Subject | null;
  subEntryToDisplay: TimetableSubEntry | undefined;
  currentFullEntry: TimetableEntry | undefined;
  isMerged: boolean;
}
