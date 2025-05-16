"use client";

import { ColorPicker } from "@/components/color-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTimetableStore } from "@/lib/store/timetable-store";

export function DisplayPanel() {
  const {
    title,
    subtitle,
    globalFont,
    titleFont,
    titleColor,
    globalColor,
    globalBackgroundColor,
    setTitle,
    setSubtitle,
    setGlobalFont,
    setTitleFont,
    setTitleColor,
    setGlobalColor,
    setGlobalBackgroundColor,
  } = useTimetableStore();

  // Mock font list - in a real app, this might come from a config or API
  const availableFonts = [
    "Arial",
    "Verdana",
    "Times New Roman",
    "Georgia",
    "Courier New",
    "Lucida Console",
  ];

  const handleTitleFontChange = (newFont: string) => {
    if (newFont === "__USE_GLOBAL_FONT__") {
      setTitleFont(globalFont);
    } else {
      setTitleFont(newFont);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Display Customization</h3>
        <p className="text-sm text-muted-foreground">
          Modify the appearance and general information of your timetable.
        </p>
      </div>

      {/* Global Styling Section */}
      <div className="space-y-4 border-t pt-4">
        <h4 className="font-medium">Global Styling</h4>
        <div className="space-y-1">
          <label htmlFor="global-font" className="block text-sm font-medium">
            Global Font
          </label>
          <Select value={globalFont} onValueChange={setGlobalFont}>
            <SelectTrigger id="global-font" className="w-full">
              <SelectValue placeholder="Select a font" />
            </SelectTrigger>
            <SelectContent>
              {availableFonts.map((font) => (
                <SelectItem key={font} value={font}>
                  {font}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label
            htmlFor="global-text-color"
            className="block text-sm font-medium"
          >
            Global Text Color
          </label>
          <ColorPicker value={globalColor} onChange={setGlobalColor} />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="global-bg-color"
            className="block text-sm font-medium"
          >
            Global Background Color (Header Row)
          </label>
          <ColorPicker
            value={globalBackgroundColor}
            onChange={setGlobalBackgroundColor}
          />
        </div>
      </div>

      {/* Separator */}
      <hr className="my-6" />

      {/* Title Styling Section */}
      <div className="space-y-4">
        <h4 className="font-medium">Title & Subtitle</h4>
        <div className="space-y-1">
          <label
            htmlFor="timetable-title"
            className="block text-sm font-medium"
          >
            Title Text
          </label>
          <input
            id="timetable-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border rounded p-2 w-full"
            placeholder="My Timetable"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="title-font" className="block text-sm font-medium">
              Title Font
            </label>
            <Select
              value={
                titleFont === globalFont ? "__USE_GLOBAL_FONT__" : titleFont
              }
              onValueChange={handleTitleFontChange}
            >
              <SelectTrigger id="title-font" className="w-full">
                <SelectValue placeholder="Select a font" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__USE_GLOBAL_FONT__">
                  Use Global Font ({globalFont})
                </SelectItem>
                {availableFonts
                  .filter((font) => font !== globalFont)
                  .map((font) => (
                    <SelectItem key={font} value={font}>
                      {font}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label htmlFor="title-color" className="block text-sm font-medium">
              Title Color
            </label>
            <ColorPicker value={titleColor} onChange={setTitleColor} />
          </div>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="timetable-subtitle"
            className="block text-sm font-medium"
          >
            Subtitle Text
          </label>
          <input
            id="timetable-subtitle"
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="border rounded p-2 w-full"
            placeholder="School Year 2023-2024"
          />
        </div>
      </div>
    </div>
  );
}
