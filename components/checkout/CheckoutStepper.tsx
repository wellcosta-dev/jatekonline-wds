"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { num: 1, label: "Adatok" },
  { num: 2, label: "Szállítás" },
  { num: 3, label: "Fizetés" },
] as const;

interface CheckoutStepperProps {
  currentStep: 1 | 2 | 3;
}

export function CheckoutStepper({ currentStep }: CheckoutStepperProps) {
  return (
    <nav aria-label="Rendelés lépései" className="w-full max-w-lg mx-auto">
      <div className="flex items-center">
        {STEPS.map((step, index) => {
          const isActive = currentStep === step.num;
          const isCompleted = currentStep > step.num;
          const isFuture = currentStep < step.num;
          const isLast = index === STEPS.length - 1;

          return (
            <div key={step.num} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-2 flex-shrink-0 relative z-10">
                <div
                  className={cn(
                    "flex items-center justify-center size-9 sm:size-11 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all duration-300",
                    isActive && "bg-primary text-white shadow-lg shadow-primary/30 scale-105",
                    isCompleted && "bg-emerald-500 text-white",
                    isFuture && "bg-gray-100 text-gray-400 border border-gray-200"
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-5" strokeWidth={2.5} />
                  ) : (
                    step.num
                  )}
                </div>
                <span
                  className={cn(
                    "text-[11px] sm:text-xs font-semibold tracking-tight text-center whitespace-nowrap",
                    isActive && "text-primary",
                    isCompleted && "text-emerald-600",
                    isFuture && "text-gray-400"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {!isLast && (
                <div className="flex-1 mx-1.5 sm:mx-2 mb-4 sm:mb-5">
                  <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        isCompleted
                          ? "w-full bg-emerald-500"
                          : isActive
                          ? "w-1/2 bg-primary"
                          : "w-0"
                      )}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
