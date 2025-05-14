"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

type ColorPickerProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

// List of preset colors
const presetColors = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#22c55e", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#14b8a6", // teal
  "#a16207", // yellow-800
  "#84cc16", // lime
  "#f97316", // orange
  "#9333ea", // purple
  "#6366f1", // indigo
  "#0ea5e9", // sky
  "#d946ef", // fuchsia
  "#6b7280", // gray
];

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const [color, setColor] = useState(value);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);
  const colorMapRef = useRef<HTMLDivElement>(null);
  const hueSliderRef = useRef<HTMLDivElement>(null);

  // Keep local state in sync with props
  useEffect(() => {
    setColor(value);
    updateHSLFromHex(value);
  }, [value]);

  // Update HSL values from hex
  const updateHSLFromHex = (hexColor: string) => {
    try {
      const rgb = hexToRgb(hexColor);
      if (rgb) {
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        setHue(Math.round(hsl.h));
        setSaturation(Math.round(hsl.s * 100));
        setLightness(Math.round(hsl.l * 100));
      }
    } catch {
      // If there's an error parsing, just keep current values
    }
  };

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    onChange(newColor);
    updateHSLFromHex(newColor);
  };

  // Format a color string to ensure it's valid
  const formatColor = (color: string) => {
    // Ensure color starts with a # if it doesn't
    if (!color.startsWith("#")) {
      return `#${color}`;
    }
    return color;
  };

  // Handle manual input of hex color
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setColor(newColor);

    // Only update parent if it's a valid hex color
    if (/^#[0-9A-F]{6}$/i.test(newColor)) {
      onChange(newColor);
      updateHSLFromHex(newColor);
    }
  };

  // Update color when input loses focus - reformat if needed
  const handleInputBlur = () => {
    try {
      // Force formatting and validation
      const formattedColor = formatColor(color);
      setColor(formattedColor);
      onChange(formattedColor);
      updateHSLFromHex(formattedColor);
    } catch {
      // If invalid, revert to previous valid color
      setColor(value);
    }
  };

  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  // Convert RGB to HSL
  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }

      h /= 6;
    }

    return { h: h * 360, s, l };
  };

  // Convert HSL to hex
  const hslToHex = (h: number, s: number, l: number) => {
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0,
      g = 0,
      b = 0;

    if (0 <= h && h < 60) {
      r = c;
      g = x;
      b = 0;
    } else if (60 <= h && h < 120) {
      r = x;
      g = c;
      b = 0;
    } else if (120 <= h && h < 180) {
      r = 0;
      g = c;
      b = x;
    } else if (180 <= h && h < 240) {
      r = 0;
      g = x;
      b = c;
    } else if (240 <= h && h < 300) {
      r = x;
      g = 0;
      b = c;
    } else if (300 <= h && h < 360) {
      r = c;
      g = 0;
      b = x;
    }

    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    const toHex = (c: number) => {
      const hex = c.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  // Handle drag on the color map
  const handleColorMapInteraction = (
    event: React.MouseEvent | React.TouchEvent
  ) => {
    if (!colorMapRef.current) return;

    event.preventDefault();

    const rect = colorMapRef.current.getBoundingClientRect();
    const clientX =
      "touches" in event ? event.touches[0].clientX : event.clientX;
    const clientY =
      "touches" in event ? event.touches[0].clientY : event.clientY;

    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    const newSaturation = Math.round(x * 100);
    const newLightness = Math.round((1 - y) * 100);

    setSaturation(newSaturation);
    setLightness(newLightness);

    const newHexColor = hslToHex(hue, newSaturation, newLightness);
    setColor(newHexColor);
    onChange(newHexColor);
  };

  // Handle drag on the hue slider
  const handleHueInteraction = (event: React.MouseEvent | React.TouchEvent) => {
    if (!hueSliderRef.current) return;

    event.preventDefault();

    const rect = hueSliderRef.current.getBoundingClientRect();
    const clientX =
      "touches" in event ? event.touches[0].clientX : event.clientX;

    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newHue = Math.round(x * 360);

    setHue(newHue);

    const newHexColor = hslToHex(newHue, saturation, lightness);
    setColor(newHexColor);
    onChange(newHexColor);
  };

  // Add mouse event handlers
  const handleMouseDown =
    (handler: (e: React.MouseEvent | React.TouchEvent) => void) =>
    (e: React.MouseEvent) => {
      handler(e);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        handler({
          clientX: moveEvent.clientX,
          clientY: moveEvent.clientY,
          preventDefault: () => {},
        } as unknown as React.MouseEvent);
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    };

  // Add touch event handlers
  const handleTouchStart =
    (handler: (e: React.MouseEvent | React.TouchEvent) => void) =>
    (e: React.TouchEvent) => {
      handler(e);

      const handleTouchMove = (moveEvent: TouchEvent) => {
        handler({
          touches: moveEvent.touches,
          preventDefault: () => moveEvent.preventDefault(),
        } as unknown as React.TouchEvent);
      };

      const handleTouchEnd = () => {
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };

      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleTouchEnd);
    };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="w-9 h-9 rounded-md border border-input shadow-sm flex items-center justify-center hover:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
            style={{ backgroundColor: color }}
            aria-label="Pick a color"
          />
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="start">
          <div className="space-y-3">
            {/* Color map (saturation-lightness) */}
            <div
              className="relative h-32 rounded-md overflow-hidden"
              ref={colorMapRef}
              onMouseDown={handleMouseDown(handleColorMapInteraction)}
              onTouchStart={handleTouchStart(handleColorMapInteraction)}
              style={{
                backgroundColor: hslToHex(hue, 100, 50),
                cursor: "crosshair",
              }}
            >
              {/* White to transparent gradient (horizontal) */}
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(to right, white, transparent)",
                }}
              ></div>
              {/* Black to transparent gradient (vertical) */}
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(to bottom, transparent, black)",
                }}
              ></div>
              {/* Color selector */}
              <div
                className="absolute w-3 h-3 rounded-full border-2 border-white transform -translate-x-1/2 -translate-y-1/2 shadow-sm"
                style={{
                  left: `${saturation}%`,
                  top: `${100 - lightness}%`,
                }}
              ></div>
            </div>

            {/* Hue slider */}
            <div
              className="relative h-4 rounded-md"
              ref={hueSliderRef}
              onMouseDown={handleMouseDown(handleHueInteraction)}
              onTouchStart={handleTouchStart(handleHueInteraction)}
              style={{
                background:
                  "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
                cursor: "ew-resize",
              }}
            >
              <div
                className="absolute w-2 h-full rounded-md border border-white transform -translate-x-1/2 shadow-sm"
                style={{
                  left: `${(hue / 360) * 100}%`,
                  backgroundColor: hslToHex(hue, 100, 50),
                }}
              ></div>
            </div>

            {/* Hex input and color input */}
            <div className="flex justify-between">
              <input
                type="color"
                value={color}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-8 h-8 rounded-md overflow-hidden cursor-pointer"
              />
              <input
                type="text"
                value={color}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                className="flex-1 ml-2 px-2 py-1 text-sm border rounded-md"
                placeholder="#000000"
              />
            </div>

            {/* HSL values display */}
            <div className="grid grid-cols-3 gap-1 text-xs">
              <div className="flex flex-col">
                <span className="text-muted-foreground">H: {hue}°</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">S: {saturation}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">L: {lightness}%</span>
              </div>
            </div>

            {/* Preset colors */}
            <div className="grid grid-cols-8 gap-1">
              {presetColors.map((presetColor) => (
                <button
                  key={presetColor}
                  className={cn(
                    "w-6 h-6 rounded-md hover:scale-110 transition-transform",
                    color === presetColor && "ring-2 ring-ring ring-offset-1"
                  )}
                  style={{ backgroundColor: presetColor }}
                  onClick={() => handleColorChange(presetColor)}
                  aria-label={`Color: ${presetColor}`}
                />
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <input
        type="text"
        value={color}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        className="flex-1 px-3 py-2 text-sm rounded-md border border-input"
        placeholder="#000000"
      />
    </div>
  );
}
