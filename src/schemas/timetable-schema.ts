import { z } from "zod";

// Time format validator (HH:MM)
const timeFormatRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;

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
  icon: z.string().optional(),
  abbreviation: z.string().optional(),
  image: z.string().url({ message: "URL d'image invalide" }).optional(),
  teacherOrCoach: z.string().optional(),
});

// New schema for a sub-entry within a week
export const TimetableSubEntrySchema = z.object({
  subjectId: z.string().min(1, "ID de matière requis pour le sous-créneau"),
  room: z.string().optional(),
  teacher: z.string().optional(),
  notes: z.string().optional(),
  overrideColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Format de couleur invalide")
    .optional(),
  overrideIcon: z.string().optional(),
  overrideAbbreviation: z.string().optional(),
  overrideImage: z.string().url({ message: "URL d'image invalide" }).optional(),
});

export const TimetableEntrySchema = z
  .object({
    day: z.number().min(0).max(6, "Jour invalide"), // 0-5 for Mon-Sat, or 0-6 if Sunday included
    timeSlotIndex: z.number().min(0, "Index de créneau horaire invalide"),
    weekA: TimetableSubEntrySchema.optional(),
    weekB: TimetableSubEntrySchema.optional(),
    weekC: TimetableSubEntrySchema.optional(),
  })
  .refine((data) => data.weekA || data.weekB || data.weekC, {
    message: "Au moins un créneau hebdomadaire (A, B, ou C) doit être défini",
    // This path might need adjustment if it doesn't point to a specific field for UI errors.
    // Consider not having this refinement if an empty entry (no weeks filled) is permissible before interaction.
  });

export const TimetableConfigSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  subtitle: z.string().optional(),
  timeSlots: z.array(TimeSlotSchema),
  subjects: z.array(SubjectSchema),
  entries: z.array(TimetableEntrySchema), // Updated to use the new TimetableEntrySchema
  weekType: z.enum(["single", "ab", "abc"], {
    required_error: "Le type de semaine est requis",
  }),
  currentWeekType: z.enum(["a", "b", "c"], {
    required_error: "Le type de semaine actuel est requis",
  }),
});
