import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCompanySchema, type Company, type InsertCompany } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Building2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

export default function Companies() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const { data: companies = [], isLoading } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const createForm = useForm<InsertCompany>({
    resolver: zodResolver(insertCompanySchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      state: "",
      gstNo: "",
    },
  });

  const editForm = useForm<InsertCompany>({
    resolver: zodResolver(insertCompanySchema),
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertCompany) => {
      return await apiRequest("POST", "/api/companies", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-companies"] });
      toast({ title: "Company created successfully" });
      setIsCreateDialogOpen(false);
      createForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to create company", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: InsertCompany }) => {
      return await apiRequest("PUT", `/api/companies/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-companies"] });
      toast({ title: "Company updated successfully" });
      setIsEditDialogOpen(false);
      setSelectedCompany(null);
    },
    onError: () => {
      toast({ title: "Failed to update company", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/companies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-companies"] });
      toast({ title: "Company deleted successfully" });
      setIsDeleteDialogOpen(false);
      setSelectedCompany(null);
    },
    onError: () => {
      toast({ title: "Failed to delete company", variant: "destructive" });
    },
  });

  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    editForm.reset({
      name: company.name,
      address: company.address || "",
      city: company.city || "",
      state: company.state || "",
      gstNo: company.gstNo || "",
      expiryDate: company.expiryDate ? new Date(company.expiryDate) : undefined,
    });
    setIsEditDialogOpen(true);
  };

  const getExpiryStatus = (expiryDate: Date | null | undefined) => {
    if (!expiryDate) return { status: "No Expiry", color: "text-green-600", icon: CheckCircle2 };
    
    const now = new Date();
    const daysUntilExpiry = Math.ceil((new Date(expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { status: "Expired", color: "text-red-600", icon: AlertCircle };
    } else if (daysUntilExpiry <= 30) {
      return { status: `Expiring in ${daysUntilExpiry}d`, color: "text-yellow-600", icon: AlertCircle };
    }
    return { status: `Active - ${daysUntilExpiry}d left`, color: "text-green-600", icon: CheckCircle2 };
  };

  const handleDelete = (company: Company) => {
    setSelectedCompany(company);
    setIsDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Loading companies...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Company Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage companies in your system
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-company">
              <Plus className="h-4 w-4 mr-2" />
              Add Company
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Company</DialogTitle>
              <DialogDescription>
                Add a new company to the system
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form
                onSubmit={createForm.handleSubmit((data) =>
                  createMutation.mutate(data)
                )}
                className="space-y-4"
              >
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          data-testid="input-company-name"
                          placeholder="Enter company name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          data-testid="input-company-address"
                          placeholder="Enter address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            data-testid="input-company-city"
                            placeholder="City"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            data-testid="input-company-state"
                            placeholder="State"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={createForm.control}
                  name="gstNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GST Number</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          data-testid="input-company-gst"
                          placeholder="Enter GST number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Software Expiry Date (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          data-testid="input-company-expiry"
                          value={field.value ? (typeof field.value === "string" ? field.value.split("T")[0] : format(new Date(field.value), "yyyy-MM-dd")) : ""}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="submit"
                    data-testid="button-submit-company"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Companies</CardTitle>
          <CardDescription>
            {companies.length} {companies.length === 1 ? "company" : "companies"} in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No companies yet. Create your first company to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>GST Number</TableHead>
                  <TableHead>License Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => {
                  const expiryStatus = getExpiryStatus(company.expiryDate);
                  const StatusIcon = expiryStatus.icon;
                  return (
                  <TableRow key={company.id} data-testid={`row-company-${company.id}`}>
                    <TableCell className="font-medium" data-testid={`text-company-name-${company.id}`}>
                      {company.name}
                    </TableCell>
                    <TableCell>{company.address}</TableCell>
                    <TableCell>{company.city}</TableCell>
                    <TableCell>{company.state}</TableCell>
                    <TableCell>{company.gstNo}</TableCell>
                    <TableCell data-testid={`text-expiry-${company.id}`}>
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`h-4 w-4 ${expiryStatus.color}`} />
                        <span className={expiryStatus.color}>{expiryStatus.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(company)}
                        data-testid={`button-edit-company-${company.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(company)}
                        data-testid={`button-delete-company-${company.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
            <DialogDescription>
              Update company information
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit((data) =>
                updateMutation.mutate({ id: selectedCompany!.id, data })
              )}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter company name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="Enter address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="City" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="State" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="gstNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST Number</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="Enter GST number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Software Expiry Date (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ? (typeof field.value === "string" ? field.value.split("T")[0] : format(new Date(field.value), "yyyy-MM-dd")) : ""}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Updating..." : "Update"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{selectedCompany?.name}" and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedCompany && deleteMutation.mutate(selectedCompany.id)}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
