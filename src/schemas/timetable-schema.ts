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

export const TimetableEntrySchema = z.object({
  day: z.number().min(0).max(6),
  timeSlotIndex: z.number().min(0),
  subjectId: z.string().min(1),
  room: z.string().optional(),
  teacher: z.string().optional(),
  notes: z.string().optional(),
});

export const TimetableConfigSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  subtitle: z.string().optional(),
  timeSlots: z.array(TimeSlotSchema),
  subjects: z.array(SubjectSchema),
  entries: z.array(TimetableEntrySchema),
  weekType: z.enum(["single", "ab", "abc"]),
  currentWeekType: z.enum(["a", "b", "c"]),
});
