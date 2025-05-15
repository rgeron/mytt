"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  useTimetableStore,
  type TimetableEntry,
  type WeekDesignation,
} from "@/lib/store/timetable-store";
import { useEffect, useMemo, useState } from "react";

// Helper to get the week key for TimetableEntry
function getWeekKey(
  week: WeekDesignation
): keyof Pick<TimetableEntry, "weekA" | "weekB" | "weekC"> {
  return `week${week.toUpperCase()}` as keyof Pick<
    TimetableEntry,
    "weekA" | "weekB" | "weekC"
  >;
}

type EditableProperty =
  | "color"
  | "icon"
  | "abbreviation"
  | "teacherInput"
  | "image"
  | "room";

type Scope = "partout" | "justeIci";

interface FormFields {
  color?: string;
  icon?: string;
  abbreviation?: string;
  teacherInput?: string;
  image?: string;
  room?: string;
  subjectTeacherOrCoach?: string;
  subEntryTeacher?: string;
}

interface ScopeStates {
  colorScope: Scope;
  iconScope: Scope;
  abbreviationScope: Scope;
  teacherScope: Scope;
  imageScope: Scope;
}

export function SlotsPanel() {
  const {
    selectedSlotForPanel,
    subjects,
    entries,
    currentWeekType,
    updateSubject,
    updateSubEntry,
  } = useTimetableStore();

  const [formState, setFormState] = useState<FormFields>({});
  const [scopeStates, setScopeStates] = useState<ScopeStates>({
    colorScope: "partout",
    iconScope: "partout",
    abbreviationScope: "partout",
    teacherScope: "partout",
    imageScope: "partout",
  });

  const { subject, subEntryForCurrentWeek, entry } = useMemo(() => {
    if (!selectedSlotForPanel)
      return { subject: null, subEntryForCurrentWeek: null, entry: null };

    const foundEntry = entries.find(
      (e) =>
        e.day === selectedSlotForPanel.day &&
        e.timeSlotIndex === selectedSlotForPanel.timeSlotIndex
    );
    if (!foundEntry)
      return { subject: null, subEntryForCurrentWeek: null, entry: null };

    const weekKey = getWeekKey(currentWeekType);
    const currentWeekSub = foundEntry[weekKey];

    let subjectIdToUse = currentWeekSub?.subjectId;
    if (!subjectIdToUse) {
      for (const week of ["a", "b", "c"] as WeekDesignation[]) {
        const sub = foundEntry[getWeekKey(week)];
        if (sub?.subjectId) {
          subjectIdToUse = sub.subjectId;
          break;
        }
      }
    }
    const foundSubject = subjectIdToUse
      ? subjects.find((s) => s.id === subjectIdToUse)
      : null;
    return {
      subject: foundSubject || null,
      subEntryForCurrentWeek: currentWeekSub || null,
      entry: foundEntry,
    };
  }, [selectedSlotForPanel, entries, subjects, currentWeekType]);

  useEffect(() => {
    if (subject) {
      const newFormState: FormFields = {
        color: subEntryForCurrentWeek?.overrideColor || subject.color || "",
        icon: subEntryForCurrentWeek?.overrideIcon || subject.icon || "",
        abbreviation:
          subEntryForCurrentWeek?.overrideAbbreviation ||
          subject.abbreviation ||
          "",
        image: subEntryForCurrentWeek?.overrideImage || subject.image || "",
        room: subEntryForCurrentWeek?.room || "",
        teacherInput:
          scopeStates.teacherScope === "partout"
            ? subject.teacherOrCoach || ""
            : subEntryForCurrentWeek?.teacher || "",
        subjectTeacherOrCoach: subject.teacherOrCoach,
        subEntryTeacher: subEntryForCurrentWeek?.teacher,
      };
      setFormState(newFormState);
    } else {
      setFormState({});
    }
  }, [subject, subEntryForCurrentWeek, scopeStates.teacherScope]);

  if (!selectedSlotForPanel || !subject || !entry) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Détails du créneau</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-center text-gray-500 p-6 border border-dashed rounded">
            Sélectionnez d'abord un créneau sur la grille pour le modifier.
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleInputChange = (field: keyof FormFields, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    if (field === "teacherInput") {
      if (scopeStates.teacherScope === "partout") {
        setFormState((prev) => ({ ...prev, subjectTeacherOrCoach: value }));
      } else {
        setFormState((prev) => ({ ...prev, subEntryTeacher: value }));
      }
    }
  };

  const handleScopeChange = (
    propertyKey: keyof Omit<ScopeStates, "roomScope">,
    newScope: Scope
  ) => {
    setScopeStates((prev) => ({ ...prev, [propertyKey]: newScope }));
    if (propertyKey === "teacherScope" && subject) {
      setFormState((prev) => ({
        ...prev,
        teacherInput:
          newScope === "partout"
            ? subject.teacherOrCoach || ""
            : subEntryForCurrentWeek?.teacher || "",
      }));
    }
  };

  const handleSubmit = (property: EditableProperty) => {
    if (!selectedSlotForPanel || !subject || !entry) return;
    const { day, timeSlotIndex } = selectedSlotForPanel;
    const value = formState[property as keyof FormFields];
    const subjectId = subject.id;

    switch (property) {
      case "color":
        if (scopeStates.colorScope === "partout")
          updateSubject(subject.id, { color: value });
        else
          updateSubEntry(day, timeSlotIndex, currentWeekType, {
            overrideColor: value,
            subjectId,
          });
        break;
      case "icon":
        if (scopeStates.iconScope === "partout")
          updateSubject(subject.id, { icon: value });
        else
          updateSubEntry(day, timeSlotIndex, currentWeekType, {
            overrideIcon: value,
            subjectId,
          });
        break;
      case "abbreviation":
        if (scopeStates.abbreviationScope === "partout")
          updateSubject(subject.id, { abbreviation: value });
        else
          updateSubEntry(day, timeSlotIndex, currentWeekType, {
            overrideAbbreviation: value,
            subjectId,
          });
        break;
      case "teacherInput":
        if (scopeStates.teacherScope === "partout")
          updateSubject(subject.id, { teacherOrCoach: formState.teacherInput });
        else
          updateSubEntry(day, timeSlotIndex, currentWeekType, {
            teacher: formState.teacherInput,
            subjectId,
          });
        break;
      case "image":
        if (scopeStates.imageScope === "partout")
          updateSubject(subject.id, { image: value });
        else
          updateSubEntry(day, timeSlotIndex, currentWeekType, {
            overrideImage: value,
            subjectId,
          });
        break;
      case "room":
        updateSubEntry(day, timeSlotIndex, currentWeekType, {
          room: value,
          subjectId,
        });
        break;
    }
  };

  const isBreak = subject.subjectType === "break";

  const renderPropertyEditor = (
    label: string,
    formField: keyof FormFields,
    editableProperty: EditableProperty,
    inputType: string = "text"
  ) => {
    const scopeKey = `${
      editableProperty === "teacherInput" ? "teacher" : editableProperty
    }Scope` as keyof ScopeStates;
    const currentScope =
      editableProperty === "room" ? "justeIci" : scopeStates[scopeKey];

    return (
      <div className="space-y-2">
        <Label htmlFor={formField}>{label}</Label>
        <div className="flex items-center space-x-2">
          <Input
            id={formField}
            type={inputType}
            value={formState[formField] || ""}
            onChange={(e) => handleInputChange(formField, e.target.value)}
            className="flex-grow"
          />
          <Button onClick={() => handleSubmit(editableProperty)} size="sm">
            Save
          </Button>
        </div>
        {editableProperty !== "room" && (
          <Select
            value={currentScope}
            onValueChange={(value) =>
              handleScopeChange(
                scopeKey as keyof Omit<ScopeStates, "roomScope">,
                value as Scope
              )
            }
          >
            <SelectTrigger className="w-[180px] text-xs h-8">
              <SelectValue placeholder="Scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="partout" className="text-xs">
                Appliquer partout
              </SelectItem>
              <SelectItem value="justeIci" className="text-xs">
                Appliquer juste ici
              </SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Détails du créneau: {subject.name}</CardTitle>
        <p className="text-xs text-muted-foreground">
          Jour: {selectedSlotForPanel.day + 1}, Créneau:{" "}
          {selectedSlotForPanel.timeSlotIndex + 1} (Semaine:{" "}
          {currentWeekType.toUpperCase()})
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderPropertyEditor("Couleur", "color", "color", "color")}
        {renderPropertyEditor("Icône (URL/Emoji)", "icon", "icon")}

        {!isBreak && (
          <>
            <Separator />
            {renderPropertyEditor(
              "Abréviation",
              "abbreviation",
              "abbreviation"
            )}
            {renderPropertyEditor(
              "Prof./Coach",
              "teacherInput",
              "teacherInput"
            )}
            {renderPropertyEditor("Image (URL)", "image", "image")}
            {renderPropertyEditor("Salle", "room", "room")}
          </>
        )}
        {isBreak && (
          <p className="text-sm text-muted-foreground">
            Les pauses ont des options limitées.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
