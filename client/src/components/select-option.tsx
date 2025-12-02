import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronDown } from "lucide-react";

interface SelectOptionProps<T extends { id: number; code: string; name: string }> {
  items: T[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  placeholder: string;
  getLabel: (item: T) => string;
  testId: string;
}

export function SelectOption<T extends { id: number; code: string; name: string }>({
  items,
  selectedId,
  onSelect,
  placeholder,
  getLabel,
  testId,
}: SelectOptionProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedItem = items.find((item) => item.id === selectedId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < items.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0) {
          onSelect(items[highlightedIndex].id);
          setIsOpen(false);
          setHighlightedIndex(-1);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleSelect = (item: T) => {
    onSelect(item.id);
    setIsOpen(false);
    setHighlightedIndex(-1);
    buttonRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex gap-2 items-center">
        <Button
          ref={buttonRef}
          type="button"
          variant="outline"
          className="w-full justify-between"
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          data-testid={testId}
        >
          <span className="truncate">
            {selectedItem ? (
              <span>
                <span className="font-medium">{selectedItem.code}</span>
                <span className="text-muted-foreground ml-2 text-sm">
                  {getLabel(selectedItem)}
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </Button>
        {selectedItem && (
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(null);
              setIsOpen(false);
              buttonRef.current?.focus();
            }}
            data-testid={`button-clear-${testId}`}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isOpen && items.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 border border-input bg-background rounded-md shadow-lg max-h-48 overflow-y-auto">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={`w-full text-left px-3 py-2 text-sm focus:outline-none transition-colors ${
                index === highlightedIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelect(item);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
              data-testid={`option-${testId}-${item.id}`}
            >
              <div className="font-medium">{item.code}</div>
              <div className="text-xs opacity-70">{getLabel(item)}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
