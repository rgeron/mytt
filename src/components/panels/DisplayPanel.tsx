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
        <h3 className="text-lg font-medium">
          Personnalisation de l&apos;affichage
        </h3>
      </div>

      {/* Global Styling Section */}
      <div className="space-y-4 border-t pt-4">
        <h4 className="font-medium">Style Global</h4>
        <div className="space-y-1">
          <label htmlFor="global-font" className="block text-sm font-medium">
            Police Globale
          </label>
          <Select value={globalFont} onValueChange={setGlobalFont}>
            <SelectTrigger id="global-font" className="w-full">
              <SelectValue placeholder="Sélectionnez une police" />
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
            Couleur Globale du Texte
          </label>
          <ColorPicker value={globalColor} onChange={setGlobalColor} />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="global-bg-color"
            className="block text-sm font-medium"
          >
            Couleur d&apos;Arrière-plan Globale (Ligne d&apos;en-tête)
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
        <h4 className="font-medium">Titre et Sous-titre</h4>
        <div className="space-y-1">
          <label
            htmlFor="timetable-title"
            className="block text-sm font-medium"
          >
            Texte du Titre
          </label>
          <input
            id="timetable-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border rounded p-2 w-full"
            placeholder="Mon Emploi du Temps"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="title-font" className="block text-sm font-medium">
              Police du Titre
            </label>
            <Select
              value={
                titleFont === globalFont ? "__USE_GLOBAL_FONT__" : titleFont
              }
              onValueChange={handleTitleFontChange}
            >
              <SelectTrigger id="title-font" className="w-full">
                <SelectValue placeholder="Sélectionnez une police" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__USE_GLOBAL_FONT__">
                  Utiliser la Police Globale ({globalFont})
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
              Couleur du Titre
            </label>
            <ColorPicker value={titleColor} onChange={setTitleColor} />
          </div>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="timetable-subtitle"
            className="block text-sm font-medium"
          >
            Texte du Sous-titre
          </label>
          <input
            id="timetable-subtitle"
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="border rounded p-2 w-full"
            placeholder="Année Scolaire 2023-2024"
          />
        </div>
      </div>
    </div>
  );
}
