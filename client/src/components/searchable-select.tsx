import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, ChevronDown } from "lucide-react";

interface SearchableSelectProps<T extends { id: number; code: string; name: string }> {
  items: T[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  placeholder: string;
  getLabel: (item: T) => string;
  testId: string;
}

export function SearchableSelect<T extends { id: number; code: string; name: string }>({
  items,
  selectedId,
  onSelect,
  placeholder,
  getLabel,
  testId,
}: SearchableSelectProps<T>) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedItem = items.find((item) => item.id === selectedId);
  
  const filtered = items.filter((item) =>
    item.code.toLowerCase().includes(search.toLowerCase()) ||
    item.name.toLowerCase().includes(search.toLowerCase())
  );

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filtered.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && filtered[highlightedIndex]) {
          onSelect(filtered[highlightedIndex].id);
          setSearch("");
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
    setSearch("");
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex gap-2 items-center">
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          data-testid={testId}
          className="flex-1"
          autoComplete="off"
        />
        {selectedItem && (
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(null);
              setSearch("");
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            data-testid={`button-clear-${testId}`}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <ChevronDown className="h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>

      {isOpen && filtered.length > 0 && (
        <div 
          ref={listRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 border border-input bg-background rounded-md shadow-lg max-h-48 overflow-y-auto"
        >
          {filtered.map((item, index) => (
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

      {isOpen && filtered.length === 0 && search && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 border border-input bg-background rounded-md shadow-md p-3 text-sm text-muted-foreground">
          No results found for "{search}"
        </div>
      )}

      {selectedItem && !search && !isOpen && (
        <div className="text-sm mt-1 text-muted-foreground">
          Selected: <strong>{selectedItem.code}</strong>
        </div>
      )}
    </div>
  );
}
