import { useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useTranslation } from "react-i18next";

const partyFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  shortName: z.string().optional(),
  city: z.string().min(1, "City is required"),
  pincode: z.string().min(1, "Pincode is required"),
  address: z.string().optional(),
  state: z.string().optional(),
  stateCode: z.string().optional(),
  gstNo: z.string().optional(),
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [shippingOpen, setShippingOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const { data: parties, isLoading } = useQuery<Party[]>({
    queryKey: ["/api/parties"],
  });

  const { data: agents } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

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
        title: t('messages.success'),
        description: t('messages.customerCreated'),
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: t('messages.error'),
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
        title: t('messages.success'),
        description: t('messages.customerUpdated'),
      });
      setIsDialogOpen(false);
      setEditingParty(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: t('messages.error'),
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

  const filteredParties = parties?.filter((party) =>
    party.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    party.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    party.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeAgents = agents?.filter(agent => agent.active) || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t('nav.customers')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('parties.subtitle')}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewParty} data-testid="button-add-customer">
              <Plus className="mr-2 h-4 w-4" />
              {t('parties.addCustomer')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingParty ? t('parties.editCustomer') : t('parties.addNewCustomer')}</DialogTitle>
              <DialogDescription>
                {editingParty ? t('parties.updateCustomerDetails') : t('parties.enterCustomerDetails')}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                {editingParty && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">{t('parties.customerCode')}: <span className="font-mono font-semibold text-foreground">{editingParty.code}</span></p>
                  </div>
                )}
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('parties.name')} *</FormLabel>
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
                        <FormLabel>{t('parties.shortName')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('parties.shortAlias')} data-testid="input-party-shortname" />
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
                      <FormLabel>{t('parties.address')}</FormLabel>
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
                        <FormLabel>{t('parties.city')} *</FormLabel>
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
                        <FormLabel>{t('parties.state')}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-party-state" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pincode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('parties.pincode')} *</FormLabel>
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
                        <FormLabel>{t('parties.gstNo')}</FormLabel>
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
                        <FormLabel>{t('parties.phone')}</FormLabel>
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
                      <FormLabel>{t('parties.agent')}</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === "none" ? "" : value)} 
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-party-agent">
                            <SelectValue placeholder={t('parties.selectAgentOptional')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">{t('common.none')}</SelectItem>
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
                        <FormLabel>{t('parties.openingDebit')}</FormLabel>
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
                        <FormLabel>{t('parties.openingCredit')}</FormLabel>
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
                      <span>{t('parties.shippingAddressOptional')}</span>
                      {shippingOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="shipName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('parties.shippingName')}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={t('parties.recipientName')} data-testid="input-party-shipping-name" />
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
                          <FormLabel>{t('parties.shippingAddress')}</FormLabel>
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
                            <FormLabel>{t('parties.shippingCity')}</FormLabel>
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
                            <FormLabel>{t('parties.shippingState')}</FormLabel>
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
                            <FormLabel>{t('parties.shippingPincode')}</FormLabel>
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
                        <FormLabel className="text-base">{t('parties.shareAcrossCompanies')}</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          {t('parties.shareAcrossCompaniesDesc')}
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
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-party"
                  >
                    {createMutation.isPending || updateMutation.isPending ? t('common.saving') : t('common.save')}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>{t('parties.customerList')}</CardTitle>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('parties.searchPlaceholder')}
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
                  <TableHead>{t('parties.code')}</TableHead>
                  <TableHead>{t('parties.name')}</TableHead>
                  <TableHead>{t('parties.city')}</TableHead>
                  <TableHead>{t('parties.pincode')}</TableHead>
                  <TableHead>{t('parties.phone')}</TableHead>
                  <TableHead>{t('parties.gstNo')}</TableHead>
                  <TableHead className="text-right">{t('parties.opDebit')}</TableHead>
                  <TableHead className="text-right">{t('parties.opCredit')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
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
                          <Badge variant="outline" className="text-xs">{t('parties.shared')}</Badge>
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
              <p className="text-lg font-medium text-muted-foreground">{t('parties.noCustomersFound')}</p>
              <p className="text-sm text-muted-foreground">
                {t('parties.getStarted')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
