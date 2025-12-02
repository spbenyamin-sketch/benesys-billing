import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, X } from "lucide-react";

interface Item {
  id: number;
  code: string;
  name: string;
  hsnCode: string | null;
  cost: string;
  tax: string;
  cgst: string;
  sgst: string;
  packType: string;
}

interface ItemSearchModalProps {
  open: boolean;
  items: Item[] | undefined;
  isLoading: boolean;
  onSelect: (item: Item) => void;
  onClose: () => void;
  title?: string;
}

export function ItemSearchModal({
  open,
  items = [],
  isLoading,
  onSelect,
  onClose,
  title = "Select Item",
}: ItemSearchModalProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const query = search.toLowerCase();
    return items.filter(
      (item) =>
        item.code.toLowerCase().includes(query) ||
        item.name.toLowerCase().includes(query) ||
        item.hsnCode?.toLowerCase().includes(query)
    );
  }, [search, items]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      
      // If no results, don't select anything
      if (filtered.length === 0) {
        return;
      }
      
      // Check if search matches an item code exactly
      const exactMatch = items.find(
        (item) => item.code.toLowerCase() === search.toLowerCase()
      );
      
      if (exactMatch) {
        onSelect(exactMatch);
        onClose();
        return;
      }

      // If only one result, select it
      if (filtered.length === 1) {
        onSelect(filtered[0]);
        onClose();
        return;
      }

      // If multiple results, select first match
      if (filtered.length > 0) {
        onSelect(filtered[0]);
        onClose();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-96">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by code, name, or HSN... (Enter to select)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                className="pl-9"
                data-testid="input-item-search"
              />
            </div>
            {search && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSearch("")}
                data-testid="button-clear-search"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Results Table */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading items...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search ? "No items found" : "No items available"}
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden max-h-72 overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead className="w-20">Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-20">HSN</TableHead>
                    <TableHead className="w-16">Tax %</TableHead>
                    <TableHead className="w-16">Pack</TableHead>
                    <TableHead className="w-16 text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted">
                      <TableCell className="font-medium">{item.code}</TableCell>
                      <TableCell className="text-sm">{item.name}</TableCell>
                      <TableCell className="text-xs">{item.hsnCode || "—"}</TableCell>
                      <TableCell className="text-sm">{item.tax}%</TableCell>
                      <TableCell className="text-xs">{item.packType}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            onSelect(item);
                            onClose();
                          }}
                          data-testid={`button-select-item-${item.id}`}
                        >
                          Select
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Result Count */}
          <div className="text-xs text-muted-foreground">
            Showing {filtered.length} of {items.length} items
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
