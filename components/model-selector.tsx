"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { ChevronDown, Check, Download, Cpu } from "lucide-react";
import { models } from "@/lib/models";
import { cn } from "@/lib/utils";

type ModelSelectorProps = {
  currentModel: string;
  onModelChange: (model: string) => void;
};

export function ModelSelector({ currentModel, onModelChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Mock data for downloaded models - in real app this would come from API
  const downloadedModels = [
    "google/gemma-2-9b-it",
    "meta/llama3-8b-instruct",
    "nvidia/llama3-chatqa-1.5-8b"
  ];

  const getModelIcon = (modelName: string) => {
    if (modelName.startsWith("meta")) {
      return "🦙";
    } else if (modelName.startsWith("google")) {
      return "🤖";
    } else if (modelName.startsWith("nvidia")) {
      return "🔵";
    } else if (modelName.startsWith("ibm")) {
      return "💎";
    }
    return "🧠";
  };

  const getModelSize = (modelName: string) => {
    if (modelName.includes("2b")) return "~2B";
    if (modelName.includes("8b")) return "~8B";
    if (modelName.includes("9b")) return "~9B";
    if (modelName.includes("27b")) return "~27B";
    if (modelName.includes("34b")) return "~34B";
    if (modelName.includes("70b")) return "~70B";
    if (modelName.includes("340b")) return "~340B";
    return "";
  };

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 h-8 px-3 text-sm font-medium hover:bg-muted/50 transition-colors"
      >
        <span className="text-base">{getModelIcon(currentModel)}</span>
        <span className="max-w-[120px] truncate">{currentModel.split('/')[1]}</span>
        <ChevronDown size={14} className="text-muted-foreground" />
      </Button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Blur Background */}
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Card */}
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Select Model</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {models.map((model) => {
                const isDownloaded = downloadedModels.includes(model);
                const isSelected = model === currentModel;

                return (
                  <Button
                    key={model}
                    variant={isSelected ? "default" : "ghost"}
                    onClick={() => {
                      onModelChange(model);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full justify-between h-auto p-3 text-left",
                      isSelected && "bg-primary text-primary-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getModelIcon(model)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {model.split('/')[1]}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>{model.split('/')[0]}</span>
                          {getModelSize(model) && (
                            <>
                              <span>•</span>
                              <span>{getModelSize(model)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isDownloaded ? (
                        <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 dark:bg-green-950 px-2 py-1 rounded-full">
                          <Download size={10} />
                          <span>Downloaded</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 dark:bg-orange-950 px-2 py-1 rounded-full">
                          <Cpu size={10} />
                          <span>Cloud</span>
                        </div>
                      )}

                      {isSelected && (
                        <Check size={16} className="text-primary-foreground" />
                      )}
                    </div>
                  </Button>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <Download size={12} className="text-green-600" />
                  <span>Downloaded models run locally</span>
                </div>
                <div className="flex items-center gap-2">
                  <Cpu size={12} className="text-orange-600" />
                  <span>Cloud models require internet</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}