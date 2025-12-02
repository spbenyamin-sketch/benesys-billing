import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          }}
          onFocus={() => setIsOpen(true)}
          data-testid={testId}
          className="flex-1"
        />
        {selectedItem && (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              onSelect(null);
              setSearch("");
              setIsOpen(false);
            }}
            data-testid={`button-clear-${testId}`}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isOpen && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 border border-input bg-background rounded-md shadow-md max-h-48 overflow-y-auto">
          {filtered.map((item) => (
            <button
              key={item.id}
              className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm focus:outline-none focus:bg-accent"
              onClick={() => {
                onSelect(item.id);
                setSearch("");
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              data-testid={`option-${testId}-${item.id}`}
            >
              <div className="font-medium">{item.code}</div>
              <div className="text-xs opacity-70">{getLabel(item)}</div>
            </button>
          ))}
        </div>
      )}

      {selectedItem && !search && !isOpen && (
        <div className="text-sm mt-1 text-muted-foreground">
          Selected: <strong>{selectedItem.code}</strong> - {getLabel(selectedItem)}
        </div>
      )}
    </div>
  );
}
