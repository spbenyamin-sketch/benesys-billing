import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Plus, Calendar, CheckCircle, Edit, Loader2, Trash2 } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";

interface FinancialYear {
  id: number;
  companyId: number;
  label: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isClosed: boolean;
  createdAt: string;
  updatedAt: string;
}

const financialYearFormSchema = z.object({
  label: z.string().min(1, "Label is required").max(10, "Label too long (e.g., 2024-25)"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  isActive: z.boolean().default(false),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end > start;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

type FinancialYearFormData = z.infer<typeof financialYearFormSchema>;

export default function FinancialYears() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingFY, setEditingFY] = useState<FinancialYear | null>(null);
  const [deletingFY, setDeletingFY] = useState<FinancialYear | null>(null);

  const { data: financialYears, isLoading } = useQuery<FinancialYear[]>({
    queryKey: ["/api/financial-years"],
  });

  const form = useForm<FinancialYearFormData>({
    resolver: zodResolver(financialYearFormSchema),
    defaultValues: {
      label: "",
      startDate: "",
      endDate: "",
      isActive: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FinancialYearFormData) => {
      return await apiRequest("POST", "/api/financial-years", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial-years"] });
      setIsCreateOpen(false);
      form.reset();
      toast({
        title: "Financial Year Created",
        description: "The new financial year has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create financial year",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<FinancialYearFormData> }) => {
      return await apiRequest("PUT", `/api/financial-years/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial-years"] });
      setEditingFY(null);
      form.reset();
      toast({
        title: "Financial Year Updated",
        description: "The financial year has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update financial year",
        variant: "destructive",
      });
    },
  });

  const activateMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("POST", `/api/financial-years/${id}/activate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial-years"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-years/active"] });
      toast({
        title: "Financial Year Activated",
        description: "The financial year is now active. All new bills will use this FY.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to activate financial year",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/financial-years/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial-years"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-years/active"] });
      setDeletingFY(null);
      toast({
        title: "Financial Year Deleted",
        description: "The financial year has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      setDeletingFY(null);
      toast({
        title: "Error",
        description: error.message || "Failed to delete financial year",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FinancialYearFormData) => {
    if (editingFY) {
      updateMutation.mutate({ id: editingFY.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openCreateDialog = () => {
    form.reset({
      label: "",
      startDate: "",
      endDate: "",
      isActive: false,
    });
    setIsCreateOpen(true);
  };

  const openEditDialog = (fy: FinancialYear) => {
    form.reset({
      label: fy.label,
      startDate: fy.startDate.split("T")[0],
      endDate: fy.endDate.split("T")[0],
      isActive: fy.isActive,
    });
    setEditingFY(fy);
  };

  const suggestLabel = (startDate: string) => {
    if (!startDate) return "";
    const date = new Date(startDate);
    const startYear = date.getFullYear();
    const endYear = (startYear + 1) % 100;
    return `${startYear}-${String(endYear).padStart(2, "0")}`;
  };

  const handleStartDateChange = (value: string) => {
    form.setValue("startDate", value);
    if (!form.getValues("label")) {
      form.setValue("label", suggestLabel(value));
    }
    if (value) {
      const startDate = new Date(value);
      const endDate = new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate() - 1);
      form.setValue("endDate", endDate.toISOString().split("T")[0]);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Financial Years
          </h1>
          <p className="text-muted-foreground">
            Manage financial years and bill number sequences
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} data-testid="button-create-fy">
              <Plus className="h-4 w-4 mr-2" />
              Add Financial Year
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Financial Year</DialogTitle>
              <DialogDescription>
                Add a new financial year. Bill numbers will reset to 1 for the new FY.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          onChange={(e) => handleStartDateChange(e.target.value)}
                          data-testid="input-start-date"
                        />
                      </FormControl>
                      <FormDescription>First day of the financial year</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-end-date" />
                      </FormControl>
                      <FormDescription>Last day of the financial year</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="2024-25"
                          {...field}
                          data-testid="input-fy-label"
                        />
                      </FormControl>
                      <FormDescription>
                        Short label for the FY (appears in bill numbers like B2B-2024-25-0001)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Set as Active</FormLabel>
                        <FormDescription>
                          Active FY will be used for new transactions
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-is-active"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    data-testid="button-submit-fy"
                  >
                    {createMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Create
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Financial Year List</CardTitle>
          <CardDescription>
            Each financial year maintains separate bill number sequences. Bill numbers reset to 1 when you create a new FY.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {financialYears && financialYears.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {financialYears.map((fy) => (
                  <TableRow key={fy.id} data-testid={`row-fy-${fy.id}`}>
                    <TableCell className="font-medium">{fy.label}</TableCell>
                    <TableCell>{format(new Date(fy.startDate), "dd MMM yyyy")}</TableCell>
                    <TableCell>{format(new Date(fy.endDate), "dd MMM yyyy")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {fy.isActive && (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                        {fy.isClosed && (
                          <Badge variant="secondary">Closed</Badge>
                        )}
                        {!fy.isActive && !fy.isClosed && (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(fy)}
                          data-testid={`button-edit-fy-${fy.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!fy.isActive && !fy.isClosed && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => activateMutation.mutate(fy.id)}
                            disabled={activateMutation.isPending}
                            data-testid={`button-activate-fy-${fy.id}`}
                          >
                            {activateMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Activate"
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Financial Years</h3>
              <p className="text-muted-foreground mb-4">
                Create your first financial year to start tracking bill numbers by FY.
              </p>
              <Button onClick={openCreateDialog} data-testid="button-create-first-fy">
                <Plus className="h-4 w-4 mr-2" />
                Create First Financial Year
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingFY} onOpenChange={(open) => !open && setEditingFY(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Financial Year</DialogTitle>
            <DialogDescription>
              Update the financial year details.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-edit-start-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-edit-end-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-fy-label" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Set as Active</FormLabel>
                      <FormDescription>
                        Active FY will be used for new transactions
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-edit-is-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    if (editingFY) {
                      setDeletingFY(editingFY);
                      setEditingFY(null);
                    }
                  }}
                  data-testid="button-delete-fy"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <div className="flex gap-2 ml-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingFY(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateMutation.isPending}
                    data-testid="button-update-fy"
                  >
                    {updateMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Update
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingFY} onOpenChange={(open) => !open && setDeletingFY(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Financial Year?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the financial year "{deletingFY?.label}"? 
              This action cannot be undone. Any associated bill sequences will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingFY && deleteMutation.mutate(deletingFY.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete-fy"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
