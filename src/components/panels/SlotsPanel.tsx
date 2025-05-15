"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MultipleSelector,
  type Option,
} from "@/components/ui/multiple-selector";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
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
  | "teachers"
  | "image"
  | "room";

interface FormFields {
  color?: string;
  icon?: string;
  abbreviation?: string;
  teachers?: Option[];
  image?: string;
  room?: string;
  subjectTeacherOrCoach?: string[];
  subEntryTeachers?: string[];
}

interface ScopeStates {
  colorScope: boolean;
  iconScope: boolean;
  abbreviationScope: boolean;
  teacherScope: boolean;
  imageScope: boolean;
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
    colorScope: true,
    iconScope: true,
    abbreviationScope: true,
    teacherScope: true,
    imageScope: true,
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
      // Handle legacy data where teacherOrCoach or teachers might be strings
      const ensureArray = (value: string | string[] | undefined): string[] => {
        if (!value) return [];
        return Array.isArray(value) ? value : [value];
      };

      const teacherOptions = (
        scopeStates.teacherScope
          ? ensureArray(subject.teacherOrCoach)
          : ensureArray(subEntryForCurrentWeek?.teachers)
      ).map((teacher) => ({
        value: teacher,
        label: teacher,
      }));

      const newFormState: FormFields = {
        color: subEntryForCurrentWeek?.overrideColor || subject.color || "",
        icon: subEntryForCurrentWeek?.overrideIcon || subject.icon || "",
        abbreviation:
          subEntryForCurrentWeek?.overrideAbbreviation ||
          subject.abbreviation ||
          "",
        image: subEntryForCurrentWeek?.overrideImage || subject.image || "",
        room: subEntryForCurrentWeek?.room || "",
        teachers: teacherOptions,
        subjectTeacherOrCoach: ensureArray(subject.teacherOrCoach),
        subEntryTeachers: ensureArray(subEntryForCurrentWeek?.teachers),
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
            Sélectionnez d&apos;abord un créneau sur la grille pour le modifier.
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleInputChange = (field: keyof FormFields, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleTeachersChange = (options: Option[]) => {
    setFormState((prev) => ({
      ...prev,
      teachers: options,
    }));

    if (scopeStates.teacherScope) {
      setFormState((prev) => ({
        ...prev,
        subjectTeacherOrCoach: options.map((opt) => opt.value),
      }));
    } else {
      setFormState((prev) => ({
        ...prev,
        subEntryTeachers: options.map((opt) => opt.value),
      }));
    }
  };

  const handleScopeChange = (
    propertyKey: keyof Omit<ScopeStates, "roomScope">,
    newScope: boolean
  ) => {
    setScopeStates((prev) => ({ ...prev, [propertyKey]: newScope }));
    if (propertyKey === "teacherScope" && subject) {
      // Ensure we're dealing with arrays
      const ensureArray = (value: string | string[] | undefined): string[] => {
        if (!value) return [];
        return Array.isArray(value) ? value : [value];
      };

      const teacherOptions = (
        newScope
          ? ensureArray(subject.teacherOrCoach)
          : ensureArray(subEntryForCurrentWeek?.teachers)
      ).map((teacher) => ({
        value: teacher,
        label: teacher,
      }));

      setFormState((prev) => ({
        ...prev,
        teachers: teacherOptions,
      }));
    }
  };

  const handleSubmit = (property: EditableProperty) => {
    if (!selectedSlotForPanel || !subject || !entry) return;
    const { day, timeSlotIndex } = selectedSlotForPanel;
    const subjectId = subject.id;

    switch (property) {
      case "color":
        if (scopeStates.colorScope)
          updateSubject(subject.id, { color: formState.color });
        else
          updateSubEntry(day, timeSlotIndex, currentWeekType, {
            overrideColor: formState.color,
            subjectId,
          });
        break;
      case "icon":
        if (scopeStates.iconScope)
          updateSubject(subject.id, { icon: formState.icon });
        else
          updateSubEntry(day, timeSlotIndex, currentWeekType, {
            overrideIcon: formState.icon,
            subjectId,
          });
        break;
      case "abbreviation":
        if (scopeStates.abbreviationScope)
          updateSubject(subject.id, { abbreviation: formState.abbreviation });
        else
          updateSubEntry(day, timeSlotIndex, currentWeekType, {
            overrideAbbreviation: formState.abbreviation,
            subjectId,
          });
        break;
      case "teachers":
        if (scopeStates.teacherScope)
          updateSubject(subject.id, {
            teacherOrCoach: formState.subjectTeacherOrCoach,
          });
        else
          updateSubEntry(day, timeSlotIndex, currentWeekType, {
            teachers: formState.subEntryTeachers,
            subjectId,
          });
        break;
      case "image":
        if (scopeStates.imageScope)
          updateSubject(subject.id, { image: formState.image });
        else
          updateSubEntry(day, timeSlotIndex, currentWeekType, {
            overrideImage: formState.image,
            subjectId,
          });
        break;
      case "room":
        updateSubEntry(day, timeSlotIndex, currentWeekType, {
          room: formState.room,
          subjectId,
        });
        break;
    }
  };

  const isBreak = subject.subjectType === "break";

  const renderPropertyEditor = (
    label: string,
    formField: keyof Omit<FormFields, "teachers">,
    editableProperty: EditableProperty,
    inputType: string = "text"
  ) => {
    const scopeKey = `${editableProperty}Scope` as keyof ScopeStates;
    const currentScope =
      editableProperty === "room" ? false : scopeStates[scopeKey];

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
          <div className="flex items-center space-x-2 mt-2">
            <Switch
              id={`${formField}-scope`}
              checked={currentScope}
              onCheckedChange={(checked) =>
                handleScopeChange(
                  scopeKey as keyof Omit<ScopeStates, "roomScope">,
                  checked
                )
              }
            />
            <Label htmlFor={`${formField}-scope`} className="text-xs">
              {currentScope ? "Appliquer partout" : "Appliquer juste ici"}
            </Label>
          </div>
        )}
      </div>
    );
  };

  const renderTeachersEditor = () => {
    const scopeKey = "teacherScope";
    const currentScope = scopeStates[scopeKey];

    return (
      <div className="space-y-2">
        <Label htmlFor="teachers">Prof./Coach</Label>
        <div className="flex items-center space-x-2">
          <div className="flex-grow">
            <MultipleSelector
              value={formState.teachers || []}
              onChange={handleTeachersChange}
              placeholder="Sélectionner ou ajouter"
              className="w-full"
              creatable={true}
            />
          </div>
          <Button onClick={() => handleSubmit("teachers")} size="sm">
            Save
          </Button>
        </div>
        <div className="flex items-center space-x-2 mt-2">
          <Switch
            id="teachers-scope"
            checked={currentScope}
            onCheckedChange={(checked) =>
              handleScopeChange(
                scopeKey as keyof Omit<ScopeStates, "roomScope">,
                checked
              )
            }
          />
          <Label htmlFor="teachers-scope" className="text-xs">
            {currentScope ? "Appliquer partout" : "Appliquer juste ici"}
          </Label>
        </div>
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
      <CardContent className="space-y-6">
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
            {renderTeachersEditor()}
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
