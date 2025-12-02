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

interface Party {
  id: number;
  code: string;
  name: string;
  shortname: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  stateCode: string | null;
  gstNo: string | null;
}

interface PartySearchModalProps {
  open: boolean;
  parties: Party[] | undefined;
  isLoading: boolean;
  onSelect: (party: Party) => void;
  onClose: () => void;
  title?: string;
}

export function PartySearchModal({
  open,
  parties = [],
  isLoading,
  onSelect,
  onClose,
  title = "Select Customer",
}: PartySearchModalProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return parties;
    const query = search.toLowerCase();
    return parties.filter(
      (party) =>
        party.code.toLowerCase().includes(query) ||
        party.name.toLowerCase().includes(query) ||
        party.gstNo?.toLowerCase().includes(query)
    );
  }, [search, parties]);

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
                placeholder="Search by code, name, or GSTIN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="pl-9"
                data-testid="input-party-search"
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
              Loading customers...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search ? "No customers found" : "No customers available"}
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden max-h-72 overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead className="w-20">Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-24">City</TableHead>
                    <TableHead className="w-28">GSTIN</TableHead>
                    <TableHead className="w-16 text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((party) => (
                    <TableRow key={party.id} className="hover:bg-muted">
                      <TableCell className="font-medium">{party.code}</TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{party.name}</div>
                        {party.address && (
                          <div className="text-xs text-muted-foreground">
                            {party.address}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{party.city}</TableCell>
                      <TableCell className="text-xs">{party.gstNo || "—"}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            onSelect(party);
                            onClose();
                          }}
                          data-testid={`button-select-party-${party.id}`}
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
            Showing {filtered.length} of {parties.length} customers
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
