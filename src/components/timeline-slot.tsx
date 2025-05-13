"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

type TimeSlot = {
  id: number;
  start: string;
  end: string;
};

type TimelineSlotProps = {
  slot: TimeSlot;
  onChange: (id: number, field: "start" | "end", value: string) => void;
  onDelete: (id: number) => void;
  isFirst: boolean;
  compact?: boolean;
};

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

export function TimelineSlot({
  slot,
  onChange,
  onDelete,
  isFirst,
  compact = false,
}: TimelineSlotProps) {
  // Local state for the input field to allow partial values
  const [inputValue, setInputValue] = useState(isoToFrenchTime(slot.start));

  // Update local state when props change
  useEffect(() => {
    setInputValue(isoToFrenchTime(slot.start));
  }, [slot.start]);

  const handleInputChange = (field: "start" | "end", value: string) => {
    // Only validate and convert when the input is complete
    if (value === "" || /^\d{1,2}h\d{2}$/.test(value)) {
      const isoValue = frenchToIsoTime(value);
      onChange(slot.id, field, isoValue);
    } else if (isPartialFrenchTime(value)) {
      // If it's a partial valid input, just update local state without validation
      setInputValue(value);
    }
  };

  // Handle blur event to finalize partial inputs
  const handleBlur = () => {
    // Complete the input format if needed
    if (/^\d{1,2}$/.test(inputValue)) {
      // If just number, append "h00"
      const completeValue = `${inputValue}h00`;
      setInputValue(completeValue);
      const isoValue = frenchToIsoTime(completeValue);
      onChange(slot.id, "start", isoValue);
      if (!isFirst) {
        onChange(slot.id, "end", isoValue);
      }
    } else if (/^\d{1,2}h$/.test(inputValue)) {
      // If number followed by 'h', append "00"
      const completeValue = `${inputValue}00`;
      setInputValue(completeValue);
      const isoValue = frenchToIsoTime(completeValue);
      onChange(slot.id, "start", isoValue);
      if (!isFirst) {
        onChange(slot.id, "end", isoValue);
      }
    } else if (/^\d{1,2}h\d$/.test(inputValue)) {
      // If number followed by 'h' and one digit, append "0"
      const completeValue = `${inputValue}0`;
      setInputValue(completeValue);
      const isoValue = frenchToIsoTime(completeValue);
      onChange(slot.id, "start", isoValue);
      if (!isFirst) {
        onChange(slot.id, "end", isoValue);
      }
    } else {
      // Revert to the original value if invalid format
      setInputValue(isoToFrenchTime(slot.start));
    }
  };

  return (
    <div
      className={`relative flex items-center group ${
        compact ? "mb-2 py-1" : "mb-3 py-2"
      }`}
      title={
        isFirst
          ? "Début de journée"
          : `Point entre créneau ${slot.id - 1} et ${slot.id}`
      }
    >
      {/* Timeline dot with pulse effect */}
      <div className="absolute left-6 transform -translate-x-1.5 z-10">
        <div
          className={`${
            compact ? "w-3 h-3" : "w-4 h-4"
          } rounded-full bg-primary shadow-md relative`}
        >
          {/* Inner dot */}
          <div className={`absolute inset-1 rounded-full bg-white`}></div>
        </div>
      </div>

      {/* Time input for this point */}
      <div className={`ml-12 flex-1 flex items-center`}>
        <div className="relative">
          <Input
            id={`time-point-${slot.id}`}
            value={inputValue}
            onChange={(e) => {
              const newValue = e.target.value;
              setInputValue(newValue);

              // Only send updates for complete inputs
              if (newValue === "" || /^\d{1,2}h\d{2}$/.test(newValue)) {
                // Update this slot's start time
                handleInputChange("start", newValue);

                // If not the first slot, also update the previous slot's end time
                if (!isFirst) {
                  handleInputChange("end", newValue);
                }
              }
            }}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              }
            }}
            className={`${
              compact ? "h-7 text-xs px-3" : "h-9 text-sm"
            } w-28 pr-2 rounded-md border-muted-foreground/20 focus:border-primary focus:ring-1 focus:ring-primary transition-all`}
            placeholder={isFirst ? "8h00" : "9h00"}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {isFirst ? "début" : ""}
          </div>
        </div>

        {/* Delete button - don't allow deleting the first slot */}
        {!isFirst && (
          <Button
            variant="ghost"
            size="icon"
            className={`ml-2 ${
              compact ? "h-6 w-6" : "h-8 w-8"
            } text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all duration-200`}
            onClick={() => onDelete(slot.id)}
            title="Supprimer ce créneau"
          >
            <Trash2 className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          </Button>
        )}
      </div>

      {/* Slot description with improved styling */}
      <div className={`${compact ? "hidden" : "block"} text-xs ml-3 min-w-24`}>
        {isFirst ? (
          <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
            Début de journée
          </span>
        ) : (
          <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
            Créneau {slot.id}
          </span>
        )}
      </div>
    </div>
  );
}
