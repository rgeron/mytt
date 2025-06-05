"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Subject as SubjectFromStore,
  SubjectType,
  useTimetableStore,
} from "@/store/timetable-store";
import {
  CheckCircleIcon,
  EraserIcon,
  PlusCircleIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

// Helper to generate a random light hex color
function getRandomLightColor(): string {
  let color = "#";
  for (let i = 0; i < 3; i++) {
    // Generate a hex component between C0 and FF for lighter colors
    const component = Math.floor(Math.random() * (255 - 192) + 192).toString(
      16
    );
    color += component.length === 1 ? "0" + component : component;
  }
  return color;
}

const subjectTypeLabels: Record<SubjectType, string> = {
  school: "Matières Scolaires",
  extracurricular: "Activités Extrascolaires",
  break: "Pauses",
};

interface ActivitySearchPopoverProps {
  subjectType: SubjectType;
  label: string;
}

function ActivitySearchPopover({
  subjectType,
  label,
}: ActivitySearchPopoverProps) {
  const { subjects, addSubject, selectedActivityId, setSelectedActivityId } =
    useTimetableStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [pendingSelectionName, setPendingSelectionName] = useState<
    string | null
  >(null);

  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const subjectsOfType = useMemo(() => {
    return subjects.filter((s) => s.subjectType === subjectType);
  }, [subjects, subjectType]);

  const filteredSubjects = useMemo(() => {
    if (!searchTerm.trim()) return subjectsOfType;
    return subjectsOfType.filter(
      (subject) =>
        subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.abbreviation?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, subjectsOfType]);

  const exactMatch = useMemo(
    () =>
      filteredSubjects.find(
        (s) => s.name.toLowerCase() === searchTerm.toLowerCase()
      ),
    [filteredSubjects, searchTerm]
  );

  const currentSelectionInThisPopover = useMemo(() => {
    if (!selectedActivityId) return null;
    const subj = subjects.find((s) => s.id === selectedActivityId);
    return subj?.subjectType === subjectType ? subj : null;
  }, [selectedActivityId, subjects, subjectType]);

  const handleSelectActivity = (subjectId: string) => {
    const subject = subjects.find((s) => s.id === subjectId);
    setSelectedActivityId(subjectId);
    setSearchTerm(subject ? subject.name : "");
    setIsPopoverOpen(false);
  };

  const handleDirectAddAndSelect = () => {
    if (searchTerm.trim()) {
      const newActivityData: Omit<SubjectFromStore, "id"> = {
        name: searchTerm,
        subjectType: subjectType,
        color: getRandomLightColor(),
      };
      addSubject(newActivityData);
      setPendingSelectionName(searchTerm);
      setIsPopoverOpen(false);
    }
  };

  useEffect(() => {
    if (pendingSelectionName && subjects.length > 0) {
      const newlyAddedSubject = subjects.find(
        (s) => s.name === pendingSelectionName && s.subjectType === subjectType
      );
      if (newlyAddedSubject) {
        setSelectedActivityId(newlyAddedSubject.id);
        setSearchTerm(newlyAddedSubject.name);
        setPendingSelectionName(null);
      }
    }
  }, [
    subjects,
    pendingSelectionName,
    subjectType,
    setSelectedActivityId,
    setSearchTerm,
  ]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-muted-foreground px-1">
        {label}
      </label>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverAnchor asChild>
          <div className="relative" ref={triggerRef}>
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={
                currentSelectionInThisPopover
                  ? `Sélection: ${currentSelectionInThisPopover.name}`
                  : `Rechercher ou ajouter...`
              }
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsPopoverOpen(true);
              }}
              onFocus={() => setIsPopoverOpen(true)}
              className="pl-8 w-full text-sm h-9"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 h-auto"
                onClick={() => {
                  setSearchTerm("");
                  setIsPopoverOpen(true);
                }}
              >
                <XIcon className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        </PopoverAnchor>
        <PopoverContent
          ref={popoverRef}
          className="w-[--radix-popover-trigger-width] max-h-[300px] overflow-y-auto p-1.5 flex flex-col gap-0.5"
          align="start"
          sideOffset={5}
        >
          <>
            {filteredSubjects.map((subject) => (
              <Button
                key={subject.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start h-auto p-1.5 text-sm font-normal flex items-center gap-2",
                  selectedActivityId === subject.id &&
                    "bg-primary/10 text-primary"
                )}
                onClick={() => handleSelectActivity(subject.id)}
              >
                <span
                  style={{ backgroundColor: subject.color }}
                  className="h-3 w-3 rounded-full shrink-0 border border-background/30"
                ></span>
                <span className="flex-1 truncate">{subject.name}</span>
                {subject.icon && (
                  <span className="text-xs opacity-70">{subject.icon}</span>
                )}
                {selectedActivityId === subject.id && (
                  <CheckCircleIcon className="h-4 w-4 text-primary shrink-0" />
                )}
              </Button>
            ))}

            {!exactMatch && searchTerm.trim() && (
              <Button
                variant="ghost"
                className="w-full justify-start h-auto p-1.5 text-sm font-normal flex items-center gap-2 mt-1 border-t border-dashed"
                onClick={handleDirectAddAndSelect}
              >
                <PlusCircleIcon className="mr-1.5 h-4 w-4 text-muted-foreground" />
                Ajouter &quot;{searchTerm}&quot;...
              </Button>
            )}

            {filteredSubjects.length === 0 &&
              !searchTerm.trim() &&
              subjectsOfType.length > 0 && (
                <p className="text-xs text-muted-foreground text-center p-2">
                  Rechercher dans {label.toLowerCase()}.
                </p>
              )}
            {filteredSubjects.length === 0 &&
              !searchTerm.trim() &&
              subjectsOfType.length === 0 && (
                <p className="text-xs text-muted-foreground text-center p-2">
                  Aucune {label.toLowerCase()} définie. Ajoutez-en une.
                </p>
              )}
            {filteredSubjects.length === 0 &&
              searchTerm.trim() &&
              !exactMatch && (
                <p className="text-xs text-muted-foreground text-center p-2">
                  Aucun résultat. Créez &quot;{searchTerm}&quot;?
                </p>
              )}
          </>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function SubjectsPanel() {
  const {
    selectedActivityId,
    subjects,
    setSelectedActivityId,
    isEraserModeActive,
    toggleEraserMode,
  } = useTimetableStore();

  const currentSelectedSubjectDetails = useMemo(() => {
    if (isEraserModeActive) {
      return {
        id: "eraser-mode-active",
        name: "Mode Effaceur Actif",
        subjectType: "tool" as const,
        color: "#757575", // A neutral color for the tool
      };
    }
    return subjects.find((s) => s.id === selectedActivityId);
  }, [subjects, selectedActivityId, isEraserModeActive]);

  useEffect(() => {
    // This effect runs on mount and when setSelectedActivityId/toggleEraserMode references change (they shouldn't often)

    // Ensure selectedActivityId is null
    if (useTimetableStore.getState().selectedActivityId !== null) {
      setSelectedActivityId(null);
    }

    // Ensure eraser mode is off
    if (useTimetableStore.getState().isEraserModeActive) {
      toggleEraserMode();
    }

    return () => {
      // On unmount, perform similar cleanup
      if (useTimetableStore.getState().selectedActivityId !== null) {
        setSelectedActivityId(null);
      }
      if (useTimetableStore.getState().isEraserModeActive) {
        toggleEraserMode();
      }
    };
  }, [setSelectedActivityId, toggleEraserMode]); // Dependencies are stable store actions

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold leading-none tracking-tight px-1">
        Sélectionner une Activité ou Outil
      </h3>

      <ActivitySearchPopover
        subjectType="school"
        label={subjectTypeLabels.school}
      />
      <ActivitySearchPopover
        subjectType="extracurricular"
        label={subjectTypeLabels.extracurricular}
      />
      <ActivitySearchPopover
        subjectType="break"
        label={subjectTypeLabels.break}
      />

      <div className="mt-auto pt-4 flex flex-col items-center gap-4">
        <Button
          variant={isEraserModeActive ? "secondary" : "outline"}
          onClick={toggleEraserMode}
          size="icon" // Makes the button square (h-10 w-10 by default)
          className="rounded-md" // Standard rounding for icon buttons
          title="Mode Effaceur" // Accessibility
        >
          <EraserIcon className="h-5 w-5" />
        </Button>

        {currentSelectedSubjectDetails && (
          <div className="w-full pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-1 px-1">
              Sélection Actuelle :
            </p>
            <div
              className="p-2.5 border rounded-md flex items-center gap-3 bg-muted/30"
              style={{
                borderLeftColor: currentSelectedSubjectDetails.color,
                borderLeftWidth: "4px",
              }}
            >
              <span
                style={{ backgroundColor: currentSelectedSubjectDetails.color }}
                className="h-5 w-5 rounded-full shrink-0 border border-background/50"
              ></span>
              <div className="flex-1">
                <div className="font-medium text-sm text-foreground">
                  {currentSelectedSubjectDetails.name}
                </div>
                {currentSelectedSubjectDetails.subjectType !== "tool" && (
                  <div className="text-xs text-muted-foreground">
                    {
                      subjectTypeLabels[
                        currentSelectedSubjectDetails.subjectType as SubjectType
                      ]
                    }
                    {(currentSelectedSubjectDetails as SubjectFromStore)
                      .abbreviation &&
                      ` (${
                        (currentSelectedSubjectDetails as SubjectFromStore)
                          .abbreviation
                      })`}
                    {(currentSelectedSubjectDetails as SubjectFromStore)
                      .teacherOrCoach &&
                      ` - ${
                        (
                          currentSelectedSubjectDetails as SubjectFromStore
                        ).teacherOrCoach?.join(", ") // Ensure array is handled
                      }`}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => {
                  setSelectedActivityId(null);
                  // If eraser was active, toggling it off might be desired when deselecting its "display"
                  if (isEraserModeActive) toggleEraserMode();
                }}
                title="Désélectionner"
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        {!currentSelectedSubjectDetails && (
          <div className="w-full pt-4 border-t text-center text-sm text-muted-foreground border-dashed">
            Aucune activité sélectionnée.
          </div>
        )}
      </div>
    </div>
  );
}
