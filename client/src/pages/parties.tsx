import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Users, ChevronDown, ChevronUp } from "lucide-react";
import { ImportExport } from "@/components/ImportExport";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { INDIA_STATES, getStateFromGSTCode, isIGSTParty } from "@/lib/india-states";
import { validateGSTNumber, getGSTErrorMessage } from "@/lib/gst-validator";

const partyFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  shortName: z.string().optional(),
  city: z.string().min(1, "City is required"),
  pincode: z.string().min(1, "Pincode is required"),
  address: z.string().optional(),
  state: z.string().optional(),
  stateCode: z.string().optional(),
  gstNo: z.string().optional().refine(
    (val) => !val || validateGSTNumber(val),
    (val) => ({ message: getGSTErrorMessage(val) || "Invalid GST number" })
  ),
  phone: z.string().optional(),
  agentId: z.string().optional(),
  openingDebit: z.string().default("0"),
  openingCredit: z.string().default("0"),
  isShared: z.boolean().default(false),
  hasShippingAddress: z.boolean().default(false),
  shipName: z.string().optional(),
  shipAddress: z.string().optional(),
  shipCity: z.string().optional(),
  shipPincode: z.string().optional(),
  shipState: z.string().optional(),
});

type PartyFormValues = z.infer<typeof partyFormSchema>;

interface Party {
  id: number;
  code: string;
  name: string;
  shortName: string | null;
  address: string | null;
  city: string | null;
  pincode: string | null;
  state: string | null;
  stateCode: string | null;
  gstNo: string | null;
  phone: string | null;
  agentId: number | null;
  openingDebit: string;
  openingCredit: string;
  isShared: boolean;
  companyId: number;
  hasShippingAddress: boolean;
  shipName: string | null;
  shipAddress: string | null;
  shipCity: string | null;
  shipPincode: string | null;
  shipState: string | null;
}

interface Agent {
  id: number;
  code: string;
  name: string;
  active: boolean;
}

export default function Parties() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const LIMIT = 50;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [shippingOpen, setShippingOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => { setPage(1); }, [searchQuery]);

  const { data: partiesData, isLoading } = useQuery<{ data: Party[]; total: number; page: number; limit: number }>({
    queryKey: ["/api/parties", page, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT), search: searchQuery });
      const res = await fetch(`/api/parties?${params}`, { credentials: "include", headers: { "X-Company-Id": localStorage.getItem("currentCompanyId") || "" } });
      if (!res.ok) throw new Error("Failed to fetch parties");
      return res.json();
    },
  });
  const parties = partiesData?.data;

  const { data: agents } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  const { data: company } = useQuery({
    queryKey: ["/api/company"],
    queryFn: async () => {
      const res = await fetch("/api/company", { 
        credentials: "include",
        headers: { "X-Company-Id": localStorage.getItem("currentCompanyId") || "" }
      });
      if (!res.ok) throw new Error("Failed to fetch company");
      return res.json();
    },
  });

  const companyStateCode = company?.gstNo ? getStateFromGSTCode(company.gstNo)?.code : null;

  const form = useForm<PartyFormValues>({
    resolver: zodResolver(partyFormSchema),
    defaultValues: {
      name: "",
      shortName: "",
      city: "",
      pincode: "",
      address: "",
      state: "",
      stateCode: "",
      gstNo: "",
      phone: "",
      agentId: "",
      openingDebit: "0",
      openingCredit: "0",
      isShared: false,
      hasShippingAddress: false,
      shipName: "",
      shipAddress: "",
      shipCity: "",
      shipPincode: "",
      shipState: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PartyFormValues) => {
      const payload = {
        ...data,
        agentId: data.agentId && data.agentId !== "none" ? parseInt(data.agentId) : null,
      };
      return apiRequest("POST", "/api/parties", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parties"] });
      toast({
        title: "Success",
        description: "Customer created successfully",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: PartyFormValues }) => {
      const payload = {
        ...data,
        agentId: data.agentId && data.agentId !== "none" ? parseInt(data.agentId) : null,
      };
      return apiRequest("PUT", `/api/parties/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parties"] });
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
      setIsDialogOpen(false);
      setEditingParty(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: PartyFormValues) => {
    if (editingParty) {
      updateMutation.mutate({ id: editingParty.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (party: Party) => {
    setEditingParty(party);
    form.reset({
      name: party.name,
      shortName: party.shortName || "",
      city: party.city || "",
      pincode: party.pincode || "",
      address: party.address || "",
      state: party.state || "",
      stateCode: party.stateCode || "",
      gstNo: party.gstNo || "",
      phone: party.phone || "",
      agentId: party.agentId?.toString() || "",
      openingDebit: party.openingDebit,
      openingCredit: party.openingCredit,
      isShared: party.isShared || false,
      hasShippingAddress: party.hasShippingAddress || false,
      shipName: party.shipName || "",
      shipAddress: party.shipAddress || "",
      shipCity: party.shipCity || "",
      shipPincode: party.shipPincode || "",
      shipState: party.shipState || "",
    });
    setShippingOpen(!!(party.shipAddress || party.shipCity));
    setIsDialogOpen(true);
  };

  const handleNewParty = () => {
    setEditingParty(null);
    setShippingOpen(false);
    form.reset();
    setIsDialogOpen(true);
  };

  const filteredParties = parties;

  const activeAgents = agents?.filter(agent => agent.active) || [];

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Customers</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
            Manage your customer and supplier database
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ImportExport type="parties" queryKey="/api/parties" />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewParty} data-testid="button-add-customer" className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingParty ? "Edit Customer" : "Add New Customer"}</DialogTitle>
              <DialogDescription>
                {editingParty ? "Update customer details" : "Enter customer details below"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                {editingParty && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Customer Code: <span className="font-mono font-semibold text-foreground">{editingParty.code}</span></p>
                  </div>
                )}
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-party-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="shortName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Short Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Short alias" data-testid="input-party-shortname" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-party-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-party-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-party-state">
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {INDIA_STATES.map((state) => (
                              <SelectItem key={state.code} value={state.name}>
                                {state.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {field.value && isIGSTParty(company?.gstNo, field.value) && (
                          <p className="text-xs text-amber-600 mt-1">
                            This is an inter-state customer (IGST)
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pincode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pincode *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-party-pincode" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="gstNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GST No</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-party-gst" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-party-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="agentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agent</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === "none" ? "" : value)} 
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-party-agent">
                            <SelectValue placeholder="Select agent (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {activeAgents.map((agent) => (
                            <SelectItem key={agent.id} value={agent.id.toString()}>
                              {agent.code} - {agent.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="openingDebit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Opening Debit</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} data-testid="input-party-debit" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="openingCredit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Opening Credit</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} data-testid="input-party-credit" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Collapsible open={shippingOpen} onOpenChange={setShippingOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" type="button" className="w-full justify-between">
                      <span>Shipping Address (Optional)</span>
                      {shippingOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="shipName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Shipping Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Recipient name" data-testid="input-party-shipping-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="shipAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Shipping Address</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-party-shipping-address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid gap-4 sm:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="shipCity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Shipping City</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-party-shipping-city" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="shipState"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Shipping State</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-party-shipping-state" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="shipPincode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Shipping Pincode</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-party-shipping-pincode" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <FormField
                  control={form.control}
                  name="isShared"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Share Across Companies</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Enable to make this customer available in all companies
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-party-shared"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingParty(null);
                      form.reset();
                    }}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-party"
                  >
                    {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Customer List</CardTitle>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, code, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-parties"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredParties && filteredParties.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Pincode</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>GST No</TableHead>
                  <TableHead className="text-right">Op. Debit</TableHead>
                  <TableHead className="text-right">Op. Credit</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParties.map((party) => (
                  <TableRow key={party.id} data-testid={`row-party-${party.id}`}>
                    <TableCell className="font-mono">{party.code}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{party.name}</span>
                        {party.isShared && (
                          <Badge variant="outline" className="text-xs">Shared</Badge>
                        )}
                      </div>
                      {party.shortName && (
                        <span className="text-xs text-muted-foreground">({party.shortName})</span>
                      )}
                    </TableCell>
                    <TableCell>{party.city || "-"}</TableCell>
                    <TableCell>{party.pincode || "-"}</TableCell>
                    <TableCell>{party.phone || "-"}</TableCell>
                    <TableCell>{party.gstNo || "-"}</TableCell>
                    <TableCell className="text-right font-mono">
                      {parseFloat(party.openingDebit).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {parseFloat(party.openingCredit).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(party)}
                        data-testid={`button-edit-party-${party.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No customers found</p>
              <p className="text-sm text-muted-foreground">
                Get started by adding your first customer
              </p>
            </div>
          )}
          {partiesData && partiesData.total > LIMIT && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, partiesData.total)} of {partiesData.total} customers
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page * LIMIT >= partiesData.total} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
