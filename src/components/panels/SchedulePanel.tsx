"use client";

import { TimelineSlot } from "@/components/timeline-slot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTimetableStore } from "@/lib/store/timetable-store";
import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// Convert from ISO format (HH:MM) to French format (HhMM)
function isoToFrenchTime(isoTime: string): string {
  if (!isoTime) return "";

  const [hours, minutes] = isoTime.split(":");
  // Remove leading zero from hours
  const hoursWithoutLeadingZero = hours.replace(/^0/, "");
  return `${hoursWithoutLeadingZero}h${minutes}`;
}

// Convert from French format (HhMM) to ISO format (HH:MM)
function frenchToIsoTime(frenchTime: string): string {
  if (!frenchTime) return "";

  const match = frenchTime.match(/^(\d{1,2})h(\d{2})?$/);
  if (match) {
    const hours = match[1].padStart(2, "0");
    const minutes = match[2] ? match[2] : "00";
    return `${hours}:${minutes}`;
  }
  return frenchTime; // Return as is if not in expected format
}

// Checks if a string is likely to become a valid French time format
function isPartialFrenchTime(value: string): boolean {
  // Allow 1-2 digits for hours
  if (/^\d{1,2}$/.test(value)) return true;

  // Allow digit followed by 'h'
  if (/^\d{1,2}h$/.test(value)) return true;

  // Allow digit + 'h' + 0-2 digits for minutes
  if (/^\d{1,2}h\d{0,2}$/.test(value)) return true;

  return false;
}

export function SchedulePanel() {
  const {
    timeSlots: storeTimeSlots,
    addTimeSlot: addStoreTimeSlot,
    removeTimeSlot: removeStoreTimeSlot,
  } = useTimetableStore();

  // Convert store timeSlots to local state with IDs
  const [timeSlots, setTimeSlots] = useState(() =>
    storeTimeSlots.map((slot, index) => ({
      id: index + 1,
      start: slot.start,
      end: slot.end,
    }))
  );

  // For auto-saving changes
  const timeSlotsRef = useRef(timeSlots);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // For end time input field
  const [endTimeInput, setEndTimeInput] = useState<string>("");

  // Update local state when store changes
  useEffect(() => {
    const updatedTimeSlots = storeTimeSlots.map((slot, index) => ({
      id: index + 1,
      start: slot.start,
      end: slot.end,
    }));
    setTimeSlots(updatedTimeSlots);
    timeSlotsRef.current = updatedTimeSlots;

    // Update end time input field
    if (updatedTimeSlots.length > 0) {
      setEndTimeInput(
        isoToFrenchTime(updatedTimeSlots[updatedTimeSlots.length - 1].end)
      );
    }
  }, [storeTimeSlots]);

  const handleTimeSlotChange = (
    id: number,
    field: "start" | "end",
    value: string
  ) => {
    // Check if input is in ISO format (HH:MM)
    const isoFormatRegex = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
    // Check if input is in French format (HhMM or Hh)
    const frenchFormatRegex = /^(\d{1,2})h(\d{2})?$/;

    // Convert input to ISO format for processing if it's in French format
    let processedValue = value;

    if (frenchFormatRegex.test(value)) {
      processedValue = frenchToIsoTime(value);
    } else if (!isoFormatRegex.test(value) && value !== "") {
      toast.error(
        "Format d'heure invalide. Utilisez le format HhMM (ex: 8h00 ou 14h30)"
      );
      return;
    }

    setTimeSlots((currentSlots) => {
      // Create a copy of the current slots
      const updatedSlots = currentSlots.map((slot) =>
        slot.id === id ? { ...slot, [field]: processedValue } : slot
      );

      // If changing an end time and it's not the last slot,
      // also update the start time of the next slot
      if (field === "end" && id < updatedSlots.length) {
        const nextSlotIndex = updatedSlots.findIndex(
          (slot) => slot.id === id + 1
        );
        if (nextSlotIndex !== -1) {
          updatedSlots[nextSlotIndex] = {
            ...updatedSlots[nextSlotIndex],
            start: processedValue,
          };
        }
      }

      return updatedSlots;
    });
  };

  // Complete the end time input format if needed
  const handleEndTimeBlur = () => {
    if (/^\d{1,2}$/.test(endTimeInput)) {
      // If just number, append "h00"
      const completeValue = `${endTimeInput}h00`;
      setEndTimeInput(completeValue);
      const isoValue = frenchToIsoTime(completeValue);
      handleTimeSlotChange(timeSlots.length, "end", isoValue);
    } else if (/^\d{1,2}h$/.test(endTimeInput)) {
      // If number followed by 'h', append "00"
      const completeValue = `${endTimeInput}00`;
      setEndTimeInput(completeValue);
      const isoValue = frenchToIsoTime(completeValue);
      handleTimeSlotChange(timeSlots.length, "end", isoValue);
    } else if (/^\d{1,2}h\d$/.test(endTimeInput)) {
      // If number followed by 'h' and one digit, append "0"
      const completeValue = `${endTimeInput}0`;
      setEndTimeInput(completeValue);
      const isoValue = frenchToIsoTime(completeValue);
      handleTimeSlotChange(timeSlots.length, "end", isoValue);
    } else if (!/^\d{1,2}h\d{2}$/.test(endTimeInput)) {
      // Revert to the original value if invalid format
      if (timeSlots.length > 0) {
        setEndTimeInput(isoToFrenchTime(timeSlots[timeSlots.length - 1].end));
      }
    }
  };

  // Save changes to store
  useEffect(() => {
    // Skip initial render
    if (!timeSlots.length) return;

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set debounce for saving
    saveTimeoutRef.current = setTimeout(() => {
      // Only save if timeSlots have actually changed
      if (JSON.stringify(timeSlots) === JSON.stringify(timeSlotsRef.current)) {
        return;
      }

      // Check that times are in chronological order
      const isChronological = timeSlots.every((slot, index) => {
        if (index === timeSlots.length - 1) return true; // Last slot doesn't need checking

        const startTime = slot.start.split(":").map(Number);
        const endTime = slot.end.split(":").map(Number);

        const startMinutes = startTime[0] * 60 + startTime[1];
        const endMinutes = endTime[0] * 60 + endTime[1];

        return endMinutes > startMinutes;
      });

      if (!isChronological) {
        toast.error("Les horaires doivent être dans l'ordre chronologique");
        return;
      }

      // Convert back to store format and update store
      const storeFormat = timeSlots.map((slot) => ({
        start: slot.start,
        end: slot.end,
      }));

      // Update the store
      // Note: Rather than calling add/remove for each slot, we could add a setTimeSlots action
      // to the store for a more efficient update
      storeFormat.forEach((slot, index) => {
        if (index < storeTimeSlots.length) {
          // Update existing slots via state setter
          useTimetableStore.setState((state) => ({
            timeSlots: state.timeSlots.map((s, i) => (i === index ? slot : s)),
          }));
        } else {
          // Add new slots
          addStoreTimeSlot(slot);
        }
      });

      // Remove extra slots if needed
      if (storeTimeSlots.length > storeFormat.length) {
        for (let i = storeFormat.length; i < storeTimeSlots.length; i++) {
          removeStoreTimeSlot(i);
        }
      }

      timeSlotsRef.current = [...timeSlots];
      toast.success("Horaires mis à jour");
    }, 1000); // 1 second debounce

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [timeSlots, storeTimeSlots, addStoreTimeSlot, removeStoreTimeSlot]);

  const addTimeSlot = () => {
    if (!timeSlots.length) return;

    setTimeSlots((currentSlots) => {
      // Create a new slot with the next ID
      const lastSlot = currentSlots[currentSlots.length - 1];
      const newSlotId = lastSlot.id + 1;

      // Default to 1 hour after the last end time
      const lastEndTime = lastSlot.end;

      // Calculate times by parsing the ISO time format
      const [hourStr, minStr] = lastEndTime.split(":");
      const hour = parseInt(hourStr, 10);
      const min = minStr ? parseInt(minStr, 10) : 0;

      // Calculate new times (1 hour later)
      const newStartHour = hour;
      const newStartMin = min;

      let newEndHour = hour + 1;
      let newEndMin = min;

      // Handle overflow
      if (newEndHour >= 24) {
        newEndHour = 23;
        newEndMin = 59;
      }

      const newStart = `${newStartHour
        .toString()
        .padStart(2, "0")}:${newStartMin.toString().padStart(2, "0")}`;
      const newEnd = `${newEndHour.toString().padStart(2, "0")}:${newEndMin
        .toString()
        .padStart(2, "0")}`;

      const newSlot = {
        id: newSlotId,
        start: newStart,
        end: newEnd,
      };

      toast.success("Créneau ajouté");
      return [...currentSlots, newSlot];
    });
  };

  const deleteTimeSlot = (id: number) => {
    // Don't allow deleting the first slot or if there's only one
    if (id === 1 || timeSlots.length <= 1) {
      toast.error(
        "Impossible de supprimer le premier créneau ou le seul créneau"
      );
      return;
    }

    setTimeSlots((currentSlots) => {
      // Find the slot to delete
      const slotIndex = currentSlots.findIndex((slot) => slot.id === id);
      if (slotIndex === -1) return currentSlots;

      // Get the previous slot to update its end time
      const previousSlot = currentSlots[slotIndex - 1];
      const slotToDelete = currentSlots[slotIndex];

      // Create new array without the slot to delete
      const updatedSlots = currentSlots.filter((slot) => slot.id !== id);

      // Update the end time of the previous slot to match the end time of the deleted slot
      const previousSlotIndex = updatedSlots.findIndex(
        (slot) => slot.id === previousSlot.id
      );
      if (previousSlotIndex !== -1) {
        updatedSlots[previousSlotIndex] = {
          ...updatedSlots[previousSlotIndex],
          end: slotToDelete.end,
        };
      }

      // Update the IDs of all slots after the deleted one
      toast.success("Créneau supprimé");
      return updatedSlots.map((slot, index) => ({
        ...slot,
        id: index + 1,
      }));
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Configuration des plages horaires</h3>
      <div className="text-sm text-gray-600 mb-4">
        Définissez les plages horaires de votre emploi du temps
      </div>

      <div className="w-full">
        {/* Timeline content */}
        <div className="relative space-y-0 mt-4 pb-4">
          {/* Timeline visual */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/30 via-primary to-primary/30 rounded-full" />

          {/* Time slots */}
          <div className="space-y-0">
            {timeSlots.map((slot, index) => (
              <TimelineSlot
                key={slot.id}
                slot={slot}
                onChange={handleTimeSlotChange}
                onDelete={deleteTimeSlot}
                isFirst={index === 0}
              />
            ))}
          </div>

          {/* Last point (end of last slot) */}
          <div
            className="relative flex items-center group mb-0 py-2 mt-3"
            title="Fin de journée"
          >
            {/* Timeline dot */}
            <div className="absolute left-6 transform -translate-x-1.5 z-10">
              <div
                className="w-4 h-4 rounded-full bg-primary shadow-md relative"
                title="Fin de journée"
              >
                {/* Inner dot */}
                <div className="absolute inset-1 rounded-full bg-white"></div>
              </div>
            </div>

            {/* End time input */}
            <div className="ml-12 flex-1 flex items-center">
              <div className="relative">
                <Input
                  id={`end-${timeSlots.length}`}
                  value={endTimeInput}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setEndTimeInput(newValue);

                    // Only send updates for complete inputs
                    if (
                      timeSlots.length > 0 &&
                      (newValue === "" || /^\d{1,2}h\d{2}$/.test(newValue))
                    ) {
                      const isoValue = frenchToIsoTime(newValue);
                      handleTimeSlotChange(timeSlots.length, "end", isoValue);
                    }
                  }}
                  onBlur={handleEndTimeBlur}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.currentTarget.blur();
                    }
                  }}
                  className="h-9 text-sm w-28 pr-2 rounded-md border-muted-foreground/20 focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="20h00"
                  title="Heure de fin de journée"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  fin
                </div>
              </div>

              {/* Add new slot button */}
              <Button
                variant="outline"
                size="sm"
                className="ml-3 h-9 text-primary border-primary/30 hover:bg-primary/10 hover:text-primary hover:border-primary transition-colors group-hover:opacity-100"
                onClick={addTimeSlot}
                title="Ajouter un créneau"
              >
                <Plus className="h-4 w-4 mr-1" />
                <span className="text-sm">Ajouter un créneau</span>
              </Button>
            </div>

            {/* Description */}
            <div className="text-xs ml-3 min-w-24">
              <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-700 font-medium">
                Fin de journée
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
