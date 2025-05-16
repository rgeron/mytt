"use client";

import { ColorPicker } from "@/components/color-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MultipleSelector,
  type Option,
} from "@/components/ui/multiple-selector";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  useTimetableStore,
  type TimetableEntry,
  type WeekDesignation,
} from "@/lib/store/timetable-store";
import { ExternalLink } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

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
  | "teachers"
  | "room"
  | "color"
  | "icon"
  | "abbreviation"
  | "image"
  | "imagePosition";

interface FormFields {
  color?: string;
  icon?: Option[];
  abbreviation?: string;
  teachers?: Option[];
  image?: string;
  imagePosition?: "left" | "right";
  room?: string;
  subjectTeacherOrCoach?: string[];
  subjectIcons?: string[];
  subEntryTeachers?: string[];
}

interface ScopeStates {
  teacherScope: boolean;
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formState, setFormState] = useState<FormFields>({});
  const [scopeStates, setScopeStates] = useState<ScopeStates>({
    teacherScope: true,
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

      const iconOptions = ensureArray(subject.icon).map((icon) => ({
        value: icon,
        label: icon,
      }));

      const newFormState: FormFields = {
        color: subject.color || "",
        icon: iconOptions,
        abbreviation: subject.abbreviation || "",
        image: subject.image || "",
        imagePosition: subject.imagePosition || "left",
        room: subEntryForCurrentWeek?.room || "",
        teachers: teacherOptions,
        subjectTeacherOrCoach: ensureArray(subject.teacherOrCoach),
        subjectIcons: ensureArray(subject.icon),
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

  const handleIconsChange = (options: Option[]) => {
    setFormState((prev) => ({
      ...prev,
      icon: options,
      subjectIcons: options.map((opt) => opt.value),
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      setFormState((prev) => ({ ...prev, image: imageDataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleScopeChange = (
    propertyKey: keyof ScopeStates,
    newScope: boolean
  ) => {
    setScopeStates((prev) => ({ ...prev, [propertyKey]: newScope }));

    if (propertyKey === "teacherScope" && subject) {
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
        updateSubject(subject.id, { color: formState.color });
        break;
      case "icon":
        updateSubject(subject.id, { icon: formState.subjectIcons });
        break;
      case "abbreviation":
        updateSubject(subject.id, { abbreviation: formState.abbreviation });
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
        updateSubject(subject.id, { image: formState.image });
        break;
      case "imagePosition":
        updateSubject(subject.id, {
          imagePosition: formState.imagePosition as "left" | "right",
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
    formField: keyof Omit<FormFields, "teachers" | "icon" | "imagePosition">,
    editableProperty: EditableProperty,
    inputType: string = "text"
  ) => {
    if (formField === "color") {
      return (
        <div className="space-y-2">
          <Label htmlFor={formField}>{label}</Label>
          <div className="flex items-center space-x-2">
            <ColorPicker
              value={formState[formField] || ""}
              onChange={(newColor) => {
                handleInputChange(formField, newColor);
              }}
              className="w-full"
            />
            <Button onClick={() => handleSubmit(editableProperty)} size="sm">
              Enregistrer
            </Button>
          </div>
        </div>
      );
    }

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
            Enregistrer
          </Button>
        </div>
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
            Enregistrer
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

  const renderIconsEditor = () => {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="icons">Icône / Emoji</Label>
          <a
            href="https://getemoji.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs flex items-center text-muted-foreground hover:text-primary"
          >
            Trouver des emojis <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex-grow">
            <MultipleSelector
              value={formState.icon || []}
              onChange={handleIconsChange}
              placeholder="Ajouter un emoji"
              className="w-full"
              creatable={true}
            />
          </div>
          <Button onClick={() => handleSubmit("icon")} size="sm">
            Enregistrer
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Vous pouvez ajouter plusieurs emojis ou n&apos;en avoir aucun.
        </p>
      </div>
    );
  };

  const renderImageEditor = () => {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="image">Image</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="image"
              type="text"
              value={formState.image || ""}
              onChange={(e) => handleInputChange("image", e.target.value)}
              placeholder="URL de l'image"
              className="flex-grow"
            />
            <Button onClick={() => handleSubmit("image")} size="sm">
              Enregistrer
            </Button>
          </div>

          <div className="flex items-center space-x-2 mt-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Choisir une image
            </Button>

            {formState.image && (
              <div className="relative w-10 h-10 border rounded overflow-hidden">
                <img
                  src={formState.image}
                  alt="Aperçu"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="imagePosition">Position de l&apos;image</Label>
          <RadioGroup
            value={formState.imagePosition || "left"}
            onValueChange={(value) => {
              const newPosition = value as "left" | "right";
              handleInputChange("imagePosition", newPosition);
              if (subject) {
                updateSubject(subject.id, {
                  imagePosition: newPosition,
                });
              }
            }}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="left" id="image-left" />
              <Label htmlFor="image-left">Gauche</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="right" id="image-right" />
              <Label htmlFor="image-right">Droite</Label>
            </div>
          </RadioGroup>
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
        {renderIconsEditor()}

        {!isBreak && (
          <>
            <Separator />
            {renderPropertyEditor(
              "Abréviation",
              "abbreviation",
              "abbreviation"
            )}
            {renderTeachersEditor()}
            {renderImageEditor()}
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
