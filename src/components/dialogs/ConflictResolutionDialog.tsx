"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type {
  Subject,
  TimetableEntry,
  WeekDesignation,
} from "@/lib/store/timetable-store";

export type ConflictResolutionAction =
  | { type: "replaceAll" }
  | { type: "replaceSpecific"; week: WeekDesignation }
  | { type: "addNewToWeek"; week: WeekDesignation };

export type ConflictResolutionDialogData = {
  newSubjectId: string;
  existingEntry?: TimetableEntry;
};

export interface ConflictResolutionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  dialogData: ConflictResolutionDialogData | null;
  findSubject: (subjectId: string) => Subject | undefined;
  onResolve: (action: ConflictResolutionAction) => void;
}

export function ConflictResolutionDialog(props: ConflictResolutionDialogProps) {
  const { isOpen, onOpenChange, dialogData, findSubject, onResolve } = props;

  if (!dialogData) {
    return null;
  }

  const { newSubjectId, existingEntry } = dialogData;
  const newSubjectName = findSubject(newSubjectId)?.name || "Nouvelle Activité";

  const occupiedWeeks: WeekDesignation[] = [];
  if (existingEntry?.weekA) occupiedWeeks.push("a");
  if (existingEntry?.weekB) occupiedWeeks.push("b");
  if (existingEntry?.weekC) occupiedWeeks.push("c");

  const handleResolveAndClose = (action: ConflictResolutionAction) => {
    onResolve(action);
    onOpenChange(false); // Ensure dialog closes after action
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const getButtonConfiguration = () => {
    const buttons = [];

    if (!existingEntry || occupiedWeeks.length === 0) {
      // This case should ideally be handled before opening the dialog,
      // but if it occurs, treat as adding to Week A.
      buttons.push(
        <Button
          key="addA"
          onClick={() =>
            handleResolveAndClose({ type: "addNewToWeek", week: "a" })
          }
        >
          Ajouter &quot;{newSubjectName}&quot; en Semaine A
        </Button>
      );
    } else if (occupiedWeeks.length === 1 && existingEntry.weekA) {
      // Only Week A is filled
      buttons.push(
        <Button
          key="replaceA"
          variant="outline"
          onClick={() =>
            handleResolveAndClose({ type: "replaceSpecific", week: "a" })
          }
        >
          Remplacer{" "}
          {findSubject(existingEntry.weekA.subjectId)?.name || "Sem. A"} par
          &quot;{newSubjectName}&quot;
        </Button>
      );
      buttons.push(
        <Button
          key="addB"
          onClick={() =>
            handleResolveAndClose({ type: "addNewToWeek", week: "b" })
          }
        >
          Ajouter &quot;{newSubjectName}&quot; en Semaine B (A/B)
        </Button>
      );
    } else if (
      occupiedWeeks.length === 2 &&
      existingEntry.weekA &&
      existingEntry.weekB
    ) {
      // Weeks A and B are filled
      buttons.push(
        <Button
          key="replaceAll"
          variant="destructive"
          onClick={() => handleResolveAndClose({ type: "replaceAll" })}
        >
          Remplacer Tout par &quot;{newSubjectName}&quot;
        </Button>
      );
      buttons.push(
        <Button
          key="replaceA"
          variant="outline"
          onClick={() =>
            handleResolveAndClose({ type: "replaceSpecific", week: "a" })
          }
        >
          Remplacer{" "}
          {findSubject(existingEntry.weekA.subjectId)?.name || "Sem. A"}
        </Button>
      );
      buttons.push(
        <Button
          key="replaceB"
          variant="outline"
          onClick={() =>
            handleResolveAndClose({ type: "replaceSpecific", week: "b" })
          }
        >
          Remplacer{" "}
          {findSubject(existingEntry.weekB.subjectId)?.name || "Sem. B"}
        </Button>
      );
      buttons.push(
        <Button
          key="addC"
          onClick={() =>
            handleResolveAndClose({ type: "addNewToWeek", week: "c" })
          }
        >
          Ajouter &quot;{newSubjectName}&quot; en Semaine C (A/B/C)
        </Button>
      );
    } else if (occupiedWeeks.length === 3) {
      // Weeks A, B, and C are filled
      buttons.push(
        <Button
          key="replaceAll"
          variant="destructive"
          onClick={() => handleResolveAndClose({ type: "replaceAll" })}
        >
          Remplacer Tout par &quot;{newSubjectName}&quot;
        </Button>
      );
      ["a", "b", "c"].forEach((week) => {
        const subEntry =
          existingEntry?.[`week${week.toUpperCase() as "A" | "B" | "C"}`];
        if (subEntry) {
          buttons.push(
            <Button
              key={`replace${week}`}
              variant="outline"
              onClick={() =>
                handleResolveAndClose({
                  type: "replaceSpecific",
                  week: week as WeekDesignation,
                })
              }
            >
              Remplacer{" "}
              {findSubject(subEntry.subjectId)?.name ||
                `Sem. ${week.toUpperCase()}`}
            </Button>
          );
        }
      });
    }
    return buttons;
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Conflit d&apos;activité</AlertDialogTitle>
          <AlertDialogDescription>
            Le créneau contient déjà une ou plusieurs activités.
            {existingEntry && (
              <div className="mt-2 text-xs space-y-0.5">
                <div>Actuellement:</div>
                {existingEntry.weekA && (
                  <li>
                    Sem. A:{" "}
                    {findSubject(existingEntry.weekA.subjectId)?.name ||
                      "Activité inconnue"}
                  </li>
                )}
                {existingEntry.weekB && (
                  <li>
                    Sem. B:{" "}
                    {findSubject(existingEntry.weekB.subjectId)?.name ||
                      "Activité inconnue"}
                  </li>
                )}
                {existingEntry.weekC && (
                  <li>
                    Sem. C:{" "}
                    {findSubject(existingEntry.weekC.subjectId)?.name ||
                      "Activité inconnue"}
                  </li>
                )}
              </div>
            )}
            <div className="mt-2 text-xs">
              Nouvelle activité: <strong>{newSubjectName}</strong>
            </div>
            Que souhaitez-vous faire ?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col sm:flex-col-reverse md:flex-row gap-2 items-center">
          <AlertDialogCancel onClick={handleCancel}>Annuler</AlertDialogCancel>
          {getButtonConfiguration().map((button, index) => (
            <div key={index} className="w-full md:w-auto">
              {button}
            </div>
          ))}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
