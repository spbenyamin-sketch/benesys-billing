import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useCompany } from "@/contexts/CompanyContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface Party {
  id: number;
  name: string;
  code: string;
  address?: string;
  city?: string;
  gstNo?: string;
}

interface Item {
  id: number;
  name: string;
  code: string;
  hsnCode?: string;
  sellingPrice: string;
  mrp: string;
  packType?: string;
}

interface StockInfo {
  itemId: number;
  availableQty: number;
  isBarcoded: boolean; // true if has unique barcodes
}

interface BillItem {
  itemId: number;
  itemCode: string;
  itemName: string;
  hsnCode?: string;
  quantity: number;
  rate: number;
  amount: number;
  barcodes?: string[]; // Track used barcodes for validation
}

type BillType = "b2b" | "b2c" | "estimate";

export default function BillEntry() {
  const [, setLocation] = useLocation();
  const { currentCompany } = useCompany();
  const { toast } = useToast();
  const companyId = currentCompany?.id;

  // State
  const [billType, setBillType] = useState<BillType>("b2b");
  const [partySearch, setPartySearch] = useState("");
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [itemSearch, setItemSearch] = useState("");
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [currentRowQty, setCurrentRowQty] = useState("1");
  const [currentRowRate, setCurrentRowRate] = useState("");
  const [focusedField, setFocusedField] = useState<string>("partySearch");

  // Refs
  const partySearchRef = useRef<HTMLInputElement>(null);
  const itemSearchRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const rateRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: parties = [] } = useQuery<Party[]>({
    queryKey: ["/api/parties", companyId],
    enabled: !!companyId,
  });

  const { data: items = [] } = useQuery<Item[]>({
    queryKey: ["/api/items", companyId],
    enabled: !!companyId,
  });

  const { data: stockInfo = {} } = useQuery<{ [key: number]: StockInfo }>({
    queryKey: ["/api/stock/info", companyId],
    enabled: !!companyId,
  });

  // Mutations
  const createSaleMutation = useMutation({
    mutationFn: async (saleData: any) => {
      const response = await apiRequest("POST", "/api/sales", saleData);
      return response as any;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      toast({ title: "Success", description: "Bill created successfully" });
      setLocation(`/invoice/${data.id}`);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create bill" });
    },
  });

  // Filter parties based on search
  const filteredParties = parties.filter(p =>
    p.name.toLowerCase().includes(partySearch.toLowerCase()) ||
    p.code.toLowerCase().includes(partySearch.toLowerCase())
  );

  // Filter items based on search
  const filteredItems = items.filter(i =>
    i.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
    i.code.toLowerCase().includes(itemSearch.toLowerCase())
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleEnterPress();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [focusedField, selectedParty, itemSearch, currentRowQty, currentRowRate, billItems, filteredParties, filteredItems]);

  const handleEnterPress = useCallback(() => {
    // Enter key moves to next field
    if (focusedField === "partySearch") {
      // Select first party if available, then move to item search
      if (filteredParties.length > 0) {
        setSelectedParty(filteredParties[0]);
        setPartySearch(filteredParties[0].name);
      }
      setFocusedField("itemSearch");
      setTimeout(() => itemSearchRef.current?.focus(), 0);
    } else if (focusedField === "itemSearch") {
      // Select first item if available, then move to qty
      if (filteredItems.length > 0) {
        const selectedItem = filteredItems[0];
        setCurrentRowRate(selectedItem.sellingPrice);
        setItemSearch(selectedItem.name);
      }
      setFocusedField("qty");
      setTimeout(() => qtyRef.current?.focus(), 0);
    } else if (focusedField === "qty") {
      // Move from qty to rate
      setFocusedField("rate");
      setTimeout(() => rateRef.current?.focus(), 0);
    } else if (focusedField === "rate") {
      // Add item and reset for next item entry
      if (selectedParty && itemSearch && currentRowQty && currentRowRate) {
        const selectedItem = filteredItems[0];
        if (selectedItem) {
          const qty = parseFloat(currentRowQty);
          const stock = stockInfo[selectedItem.id];

          // Validate stock availability
          if (!stock || stock.availableQty < qty) {
            toast({
              title: "Stock Not Available",
              description: `Only ${stock?.availableQty || 0} units available for ${selectedItem.name}`,
              variant: "destructive",
            });
            return;
          }

          // For barcode items (qty=1), check if already added
          if (stock.isBarcoded && qty === 1) {
            const alreadyAdded = billItems.some(item => item.itemId === selectedItem.id);
            if (alreadyAdded) {
              toast({
                title: "Barcode Already Used",
                description: `${selectedItem.name} has already been added once (barcode item)`,
                variant: "destructive",
              });
              return;
            }
          }

          const newItem: BillItem = {
            itemId: selectedItem.id,
            itemCode: selectedItem.code,
            itemName: selectedItem.name,
            hsnCode: selectedItem.hsnCode,
            quantity: qty,
            rate: parseFloat(currentRowRate),
            amount: qty * parseFloat(currentRowRate),
            barcodes: stock.isBarcoded ? [selectedItem.code] : undefined,
          };
          setBillItems(prev => [...prev, newItem]);
          setItemSearch("");
          setCurrentRowQty("1");
          setCurrentRowRate("");
          setFocusedField("itemSearch");
          setTimeout(() => itemSearchRef.current?.focus(), 0);
        }
      }
    }
  }, [focusedField, selectedParty, itemSearch, currentRowQty, currentRowRate, billItems, filteredParties, filteredItems]);



  const handleSaveBill = async () => {
    if (!selectedParty || billItems.length === 0) {
      toast({ title: "Error", description: "Select party and add items" });
      return;
    }

    const saleType = billType.toUpperCase() as "B2B" | "B2C" | "ESTIMATE";
    const saleData = {
      saleType,
      billType: "GST",
      paymentMode: "CASH",
      date: format(new Date(), "yyyy-MM-dd"),
      partyId: selectedParty.id,
      partyName: selectedParty.name,
      partyCity: selectedParty.city,
      partyAddress: selectedParty.address,
      partyGstNo: selectedParty.gstNo,
      items: billItems.map(item => ({
        itemId: item.itemId,
        itemName: item.itemName,
        itemCode: item.itemCode,
        hsnCode: item.hsnCode,
        quantity: item.quantity.toString(),
        rate: item.rate.toString(),
        discount: "0",
        discountPercent: "0",
      })),
    };

    createSaleMutation.mutate(saleData);
  };

  if (!companyId) return <div>Loading company...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        {billType.toUpperCase()} Bill Entry
      </h1>

      {/* Bill Type Selector */}
      <div className="flex gap-2 mb-6">
        {(["b2b", "b2c", "estimate"] as BillType[]).map(type => (
          <Button
            key={type}
            onClick={() => setBillType(type)}
            variant={billType === type ? "default" : "outline"}
            data-testid={`button-bill-type-${type}`}
          >
            {type.toUpperCase()}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Party Selection */}
        <Card className="p-4">
          <label className="block text-sm font-semibold mb-2">Party Search (F2 to search)</label>
          <Input
            ref={partySearchRef}
            placeholder="Type party name or code..."
            value={partySearch}
            onChange={(e) => setPartySearch(e.target.value)}
            onFocus={() => setFocusedField("partySearch")}
            data-testid="input-party-search"
            className="mb-2"
          />
          {!selectedParty && filteredParties.length > 0 && (
            <div className="border rounded p-2 max-h-32 overflow-y-auto">
              {filteredParties.map(p => (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedParty(p);
                    setPartySearch(p.name);
                  }}
                  className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                  data-testid={`item-party-${p.id}`}
                >
                  {p.name} ({p.code})
                </div>
              ))}
            </div>
          )}
          {selectedParty && (
            <div className="bg-blue-50 p-3 rounded mt-2">
              <div className="font-semibold">{selectedParty.name}</div>
              <div className="text-sm text-gray-600">{selectedParty.code}</div>
              {selectedParty.city && <div className="text-sm text-gray-600">{selectedParty.city}</div>}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedParty(null);
                  setPartySearch("");
                }}
                className="mt-2"
                data-testid="button-clear-party"
              >
                Change Party
              </Button>
            </div>
          )}
        </Card>

        {/* Item Entry */}
        <Card className="p-4">
          <label className="block text-sm font-semibold mb-2">Item Search (Enter to select)</label>
          <Input
            ref={itemSearchRef}
            placeholder="Type item name or code..."
            value={itemSearch}
            onChange={(e) => setItemSearch(e.target.value)}
            onFocus={() => setFocusedField("itemSearch")}
            disabled={!selectedParty}
            data-testid="input-item-search"
            className="mb-2"
          />
          {itemSearch && filteredItems.length > 0 && (
            <div className="border rounded p-2 max-h-32 overflow-y-auto">
              {filteredItems.map(i => (
                <div
                  key={i.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                  data-testid={`item-option-${i.id}`}
                >
                  {i.name} ({i.code}) - ₹{i.sellingPrice}
                </div>
              ))}
            </div>
          )}

          {/* Qty & Rate Entry */}
          {selectedParty && (
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div>
                <label className="text-xs font-semibold">Qty</label>
                <Input
                  ref={qtyRef}
                  type="number"
                  value={currentRowQty}
                  onChange={(e) => setCurrentRowQty(e.target.value)}
                  onFocus={(e) => {
                    setFocusedField("qty");
                    e.currentTarget.select();
                  }}
                  data-testid="input-qty"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Rate</label>
                <Input
                  ref={rateRef}
                  type="number"
                  value={currentRowRate}
                  onChange={(e) => setCurrentRowRate(e.target.value)}
                  onFocus={(e) => {
                    setFocusedField("rate");
                    e.currentTarget.select();
                  }}
                  data-testid="input-rate"
                  placeholder="0"
                />
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Items List */}
      {billItems.length > 0 && (
        <Card className="p-4 mt-6">
          <h2 className="font-semibold mb-3">Items in Bill</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Item</th>
                  <th className="text-left p-2">HSN</th>
                  <th className="text-right p-2">Qty</th>
                  <th className="text-right p-2">Rate</th>
                  <th className="text-right p-2">Amount</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {billItems.map((item, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="p-2">{item.itemName}</td>
                    <td className="p-2">{item.hsnCode}</td>
                    <td className="text-right p-2">{item.quantity}</td>
                    <td className="text-right p-2">₹{item.rate.toFixed(2)}</td>
                    <td className="text-right p-2">₹{item.amount.toFixed(2)}</td>
                    <td className="p-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setBillItems(billItems.filter((_, i) => i !== idx))}
                        data-testid={`button-delete-item-${idx}`}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t font-semibold">
                  <td colSpan={4} className="text-right p-2">
                    Total:
                  </td>
                  <td className="text-right p-2">
                    ₹{billItems.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6">
        <Button
          onClick={handleSaveBill}
          disabled={!selectedParty || billItems.length === 0}
          data-testid="button-save-bill"
        >
          Save & Print (Ctrl+S)
        </Button>
        <Button
          variant="outline"
          onClick={() => setLocation("/sales")}
          data-testid="button-cancel"
        >
          Cancel
        </Button>
      </div>

      {/* Keyboard Help */}
      <div className="bg-blue-50 p-3 rounded mt-6 text-sm">
        <strong>Keyboard Shortcuts:</strong>
        <div className="mt-2 text-xs space-y-1">
          <div>• Enter: Select item or move to next field</div>
          <div>• Tab: Move to next field</div>
          <div>• Quantity → Rate → Enter to add item</div>
        </div>
      </div>
    </div>
  );
}
