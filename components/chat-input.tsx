"use client";

import { Button } from "./ui/button";
import Textarea from "react-textarea-autosize";
import { AiOutlineEnter } from "react-icons/ai";
import { Upload, Brain, Search, BookOpen, Clock, X } from "lucide-react";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";

type AIMode = "think-longer" | "deep-research" | "web-search" | "study";

type ChatInputProps = {
  input: string;
  setInput: (input: string) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  model: string;
  handleModelChange: (model: string) => void;
};

export default function ChatInput({
  input,
  setInput,
  handleSubmit,
  model,
  handleModelChange,
}: ChatInputProps) {
  const [selectedMode, setSelectedMode] = useState<AIMode | null>(null);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const modes = useMemo(() => [
    { id: "think-longer" as AIMode, label: "Think Longer", icon: Clock, shortcut: "/think" },
    { id: "deep-research" as AIMode, label: "Deep Research", icon: Search, shortcut: "/research" },
    { id: "web-search" as AIMode, label: "Web Search", icon: Search, shortcut: "/search" },
    { id: "study" as AIMode, label: "Study Mode", icon: BookOpen, shortcut: "/study" },
  ], []);

  // Detect slash commands - use useCallback to stabilize the function
  const detectSlashCommands = useCallback(() => {
    const slashCommands = modes.map(mode => mode.shortcut);
    const lastWord = input.split(' ').pop() || '';

    if (slashCommands.includes(lastWord)) {
      const mode = modes.find(m => m.shortcut === lastWord);
      if (mode) {
        setSelectedMode(mode.id);
        setInput(input.replace(lastWord, '').trim());
      }
    }
  }, [input, modes, setInput]);

  useEffect(() => {
    detectSlashCommands();
  }, [detectSlashCommands]);

  const handleModeSelect = (mode: AIMode) => {
    setSelectedMode(mode);
    setShowModeSelector(false);
    // Focus back to textarea
    textareaRef.current?.focus();
  };

  const clearMode = () => {
    setSelectedMode(null);
    textareaRef.current?.focus();
  };

  const handleFileUpload = () => {
    console.log("File upload clicked");
    textareaRef.current?.focus();
  };

  const getPlaceholder = () => {
    if (selectedMode) {
      const mode = modes.find(m => m.id === selectedMode);
      return `Ask me anything in ${mode?.label} mode...`;
    }
    return "Type / for modes, or ask me anything!";
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim().length === 0 || isSubmitting || !model) return;

    setIsSubmitting(true);
    try {
      await handleSubmit(e);
      // Clear mode after successful submission
      setSelectedMode(null);
      setShowModeSelector(false);
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
      // Don't auto-focus after submission to prevent jumping
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      !e.nativeEvent.isComposing &&
      !isSubmitting
    ) {
      e.preventDefault();
      if (input.trim().length > 0 && model) {
        onSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="w-full bg-gradient-to-t from-background via-background/95 to-background/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl items-center px-6 py-4">
        <div className="relative flex w-full flex-col items-start gap-2">
          {/* Mode indicator and clear button */}
          {selectedMode && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded-full">
                {(() => {
                  const mode = modes.find(m => m.id === selectedMode);
                  const Icon = mode?.icon;
                  return Icon ? <Icon size={12} /> : null;
                })()}
                <span>{modes.find(m => m.id === selectedMode)?.label}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearMode}
                  className="h-4 w-4 p-0 ml-1 hover:bg-muted-foreground/20"
                  disabled={isSubmitting}
                >
                  <X size={10} />
                </Button>
              </div>
            </div>
          )}

          <div className="relative flex w-full items-center">
            {/* Mode selector button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowModeSelector(!showModeSelector)}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-6 w-6 p-0 hover:bg-muted"
              disabled={isSubmitting}
            >
              <Brain size={14} className={selectedMode ? "text-primary" : "text-muted-foreground"} />
            </Button>

            <Textarea
              ref={textareaRef}
              name="message"
              rows={1}
              maxRows={5}
              tabIndex={0}
              placeholder={getPlaceholder()}
              spellCheck={false}
              value={input}
              disabled={isSubmitting}
              className="focus-visible:ring-nvidia min-h-10 w-full resize-none rounded-lg border border-input bg-background pb-1 pl-10 pr-20 pt-2 text-sm shadow-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />

            {/* Upload button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleFileUpload}
              className="absolute right-12 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
              disabled={isSubmitting}
            >
              <Upload size={14} />
            </Button>

            {/* Send button */}
            <Button
              type="submit"
              size="sm"
              variant="ghost"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
              disabled={input.length === 0 || !model || isSubmitting}>
              <AiOutlineEnter size={16} />
            </Button>
          </div>

          {/* Mode selector dropdown */}
          {showModeSelector && (
            <div className="absolute bottom-full mb-2 left-2 bg-popover/95 backdrop-blur-sm border border-border/50 rounded-2xl shadow-xl p-3 z-20 min-w-[280px]">
              <div className="grid grid-cols-2 gap-2">
                {modes.map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <Button
                      key={mode.id}
                      variant={selectedMode === mode.id ? "default" : "ghost"}
                      size="sm"
                      onClick={() => handleModeSelect(mode.id)}
                      className="flex items-center gap-2 justify-start text-xs h-9 rounded-xl hover:bg-muted/80 transition-colors"
                      disabled={isSubmitting}
                    >
                      <Icon size={12} />
                      <span>{mode.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <p className="p-2 text-center text-xs text-zinc-400">
          Brought to you by{" "}
          <a
            target="_blank"
            rel="noopener noreferrer"
            className="md:hover:text-nvidia underline underline-offset-2 transition-all duration-150 ease-linear"
            href="https://github.com/Divith123/LoRA-The-Second-Brain">
            LoRA Team
          </a>
        </p>
      </div>
    </form>
  );
}
