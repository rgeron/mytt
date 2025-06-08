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
import { cn } from "@/lib/utils";
import type {
  Subject,
  TimetableEntry,
  WeekDesignation,
} from "@/schemas/timetable-schema";
import { HandIcon } from "lucide-react";
import React, { useEffect, useState } from "react";

export type ConflictResolutionAction =
  | { type: "replaceAll" }
  | {
      type: "applyStagedArrangement";
      arrangement: {
        a: string | null; // subjectId or null
        b: string | null;
        c: string | null;
      };
    };
// replaceSpecific and addNewToWeek might become obsolete if all DnD changes go through applyStagedArrangement
// For now, keeping them commented out or to be removed if fully superseded.
// | { type: "replaceSpecific"; week: WeekDesignation }
// | { type: "addNewToWeek"; week: WeekDesignation };

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

interface DraggableSubjectInfo {
  subjectId: string;
  origin: WeekDesignation | "new"; // 'new' if it's the new subject being dragged
}

interface StagedWeeksType {
  a: string | null; // subjectId
  b: string | null;
  c: string | null;
}

export function ConflictResolutionDialog(props: ConflictResolutionDialogProps) {
  const { isOpen, onOpenChange, dialogData, findSubject, onResolve } = props;

  const [stagedWeeks, setStagedWeeks] = useState<StagedWeeksType>({
    a: null,
    b: null,
    c: null,
  });
  const [draggedItemInfo, setDraggedItemInfo] =
    useState<DraggableSubjectInfo | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<WeekDesignation | null>(
    null
  );

  const newSubject = dialogData ? findSubject(dialogData.newSubjectId) : null;

  useEffect(() => {
    if (dialogData?.existingEntry) {
      setStagedWeeks({
        a: dialogData.existingEntry.weekA?.subjectId || null,
        b: dialogData.existingEntry.weekB?.subjectId || null,
        c: dialogData.existingEntry.weekC?.subjectId || null,
      });
    } else {
      setStagedWeeks({ a: null, b: null, c: null }); // Reset if no existing entry
    }
  }, [dialogData?.existingEntry, isOpen]); // Re-init when dialog opens or entry changes

  if (!dialogData || !newSubject) {
    return null;
  }

  const handleApplyChanges = () => {
    onResolve({ type: "applyStagedArrangement", arrangement: stagedWeeks });
    onOpenChange(false);
  };

  const handleReplaceAll = () => {
    onResolve({ type: "replaceAll" }); // This action is handled by TimetablePreview to clear all and add new to week A
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    subjectId: string,
    origin: WeekDesignation | "new"
  ) => {
    event.dataTransfer.effectAllowed = "move";
    // Not setting data with setData for this internal DnD, rely on component state
    setDraggedItemInfo({ subjectId, origin });
  };

  const handleDragOver = (
    event: React.DragEvent<HTMLDivElement>,
    week: WeekDesignation
  ) => {
    event.preventDefault();
    setIsDraggingOver(week);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(null);
  };

  const handleDropOnWeek = (targetWeek: WeekDesignation) => {
    if (!draggedItemInfo) return;

    const { subjectId: draggedSubjectId, origin } = draggedItemInfo;
    const newStagedWeeks = { ...stagedWeeks };

    if (origin === "new") {
      // New subject is dropped on targetWeek
      // Simply replaces what's in targetWeek. The original item in targetWeek is 'lost' from staging if not handled further.
      newStagedWeeks[targetWeek] = draggedSubjectId;
    } else {
      // An existing subject from 'origin' week is dropped on 'targetWeek'
      const subjectCurrentlyAtTarget = newStagedWeeks[targetWeek];

      // Place dragged subject at target week
      newStagedWeeks[targetWeek] = draggedSubjectId;
      // Place subject that was at target week into the origin week (swap)
      newStagedWeeks[origin] = subjectCurrentlyAtTarget;
    }
    setStagedWeeks(newStagedWeeks);
    setDraggedItemInfo(null);
    setIsDraggingOver(null);
  };

  const renderSubjectCard = (
    subjectId: string | null,
    weekForOrigin: WeekDesignation | "new",
    isPlaceholder?: boolean
  ) => {
    if (!subjectId && !isPlaceholder) return null;
    const subject = subjectId ? findSubject(subjectId) : null;
    const isBeingDragged =
      draggedItemInfo?.subjectId === subjectId &&
      draggedItemInfo?.origin === weekForOrigin;

    if (isPlaceholder) {
      return (
        <div className="h-full min-h-[50px] flex items-center justify-center text-xs text-muted-foreground">
          Vide
        </div>
      );
    }
    if (!subject) return null; // Should not happen if subjectId is valid

    return (
      <div
        draggable="true"
        onDragStart={(e) => handleDragStart(e, subject.id, weekForOrigin)}
        className={cn(
          "p-2.5 border rounded-md flex items-center gap-2 cursor-grab active:cursor-grabbing w-full",
          isBeingDragged
            ? "opacity-50 ring-2 ring-primary"
            : "bg-card hover:shadow-md",
          weekForOrigin === "new" ? "bg-primary/10" : "bg-background"
        )}
        style={{
          borderColor: subject.color,
          borderLeftWidth: "4px",
        }}
      >
        <HandIcon className="h-4 w-4 text-muted-foreground shrink-0" />
        <span
          style={{ backgroundColor: subject.color }}
          className="h-4 w-4 rounded-full shrink-0 border border-background/50"
        ></span>
        <div className="font-medium text-sm text-foreground truncate">
          {subject.name}
        </div>
      </div>
    );
  };

  const weekLabels: WeekDesignation[] = ["a", "b", "c"];

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-full max-w-lg sm:max-w-xl p-6">
        <AlertDialogHeader>
          <AlertDialogTitle>Organiser les activités</AlertDialogTitle>
          <AlertDialogDescription>
            Faites glisser les activités pour les assigner ou les intervertir
            entre les semaines A, B, et C.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="mt-4 mb-4 space-y-3">
          <p className="text-sm font-medium">Nouvelle activité à placer :</p>
          {renderSubjectCard(newSubject.id, "new")}
        </div>

        <div className="mt-6 mb-6">
          <div className="grid grid-cols-3 gap-x-3 overflow-x-auto">
            {weekLabels.map((week) => (
              <div key={week} className="flex flex-col items-center min-w-0">
                <div className="p-1 mb-1.5 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Semaine {week.toUpperCase()}
                </div>
                <div
                  onDragOver={(e) => handleDragOver(e, week)}
                  onDragLeave={handleDragLeave}
                  onDrop={() => handleDropOnWeek(week)}
                  className={cn(
                    "w-full p-2 border rounded-md min-h-[80px] flex flex-col items-center justify-center transition-colors",
                    isDraggingOver === week
                      ? "border-primary bg-primary/10 ring-2 ring-primary"
                      : "border-dashed bg-muted/30 hover:border-muted-foreground/50"
                  )}
                >
                  {
                    stagedWeeks[week]
                      ? renderSubjectCard(stagedWeeks[week], week)
                      : renderSubjectCard(null, week, true) // Placeholder for empty
                  }
                </div>
              </div>
            ))}
          </div>
        </div>

        <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 border-t mt-2">
          <AlertDialogCancel onClick={handleCancel}>Annuler</AlertDialogCancel>
          <Button variant="destructive" onClick={handleReplaceAll}>
            Tout Remplacer par &quot;{newSubject.name}&quot;
          </Button>
          <Button
            onClick={handleApplyChanges}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Appliquer les modifications
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
