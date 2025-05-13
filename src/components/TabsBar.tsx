"use client";

import { TabType } from "./ConfigPanel";
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "./ui/stepper";

const tabToIndex = {
  schedule: 0,
  subjects: 1,
  display: 2,
  slots: 3,
};

const indexToTab: TabType[] = ["schedule", "subjects", "display", "slots"];

const steps = [
  {
    step: 0,
    title: "Horaires",
    description: "Jours et heures",
  },
  {
    step: 1,
    title: "Remplir",
    description: "Contenu des cours",
  },
  {
    step: 2,
    title: "Perso. Global",
    description: "Style général",
  },
  {
    step: 3,
    title: "Perso. Créneaux",
    description: "Options avancées",
  },
];

export function TabsBar({
  activeTab,
  setActiveTab,
}: {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}) {
  const activeStep = tabToIndex[activeTab];

  const handleValueChange = (step: number) => {
    setActiveTab(indexToTab[step]);
  };

  return (
    <div className="flex justify-center">
      <div className="bg-white shadow-sm rounded-full border border-gray-200 py-2 px-10 max-w-4xl w-[95%] mt-2">
        <Stepper
          value={activeStep}
          onValueChange={handleValueChange}
          className="w-full"
        >
          {steps.map(({ step, title, description }) => (
            <StepperItem
              key={step}
              step={step}
              completed={activeStep > step}
              className="[&:not(:last-child)]:flex-1"
            >
              <StepperTrigger className="gap-3 flex-col sm:flex-row sm:items-center px-1">
                <StepperIndicator className="size-6" />
                <div className="text-center sm:text-left mt-1 sm:mt-0">
                  <StepperTitle className="text-sm font-medium">
                    {title}
                  </StepperTitle>
                  <StepperDescription className="hidden sm:block text-xs">
                    {description}
                  </StepperDescription>
                </div>
              </StepperTrigger>
              {step < steps.length - 1 && <StepperSeparator className="mx-2" />}
            </StepperItem>
          ))}
        </Stepper>
      </div>
    </div>
  );
}
