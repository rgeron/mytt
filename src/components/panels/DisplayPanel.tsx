"use client";

import { ColorPicker } from "@/components/color-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTimetableStore } from "@/store/timetable-store";
import Image from "next/image";

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
    backgroundImageUrl,
    setBackgroundImageUrl,
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

      {/* Background Image Section */}
      <div className="space-y-4">
        <h4 className="font-medium">Image d&apos;Arrière-plan</h4>
        <div className="space-y-1">
          <label
            htmlFor="background-image-input"
            className="block text-sm font-medium"
          >
            Charger une image
          </label>
          <input
            id="background-image-input"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  setBackgroundImageUrl(reader.result as string);
                };
                reader.readAsDataURL(file);
              } else {
                setBackgroundImageUrl(null);
              }
            }}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
          />
        </div>
        {backgroundImageUrl && (
          <div className="mt-2 space-y-2">
            <p className="text-sm">Aperçu:</p>
            <div style={{ maxWidth: "20rem", maxHeight: "8rem" }}>
              {" "}
              {/* 320px, 128px */}
              <Image
                src={backgroundImageUrl}
                alt="Background Preview"
                width={100}
                height={100}
                objectFit="contain"
                className="rounded border"
              />
            </div>
            <button
              onClick={() => setBackgroundImageUrl(null)}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Supprimer l&apos;image
            </button>
          </div>
        )}
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
