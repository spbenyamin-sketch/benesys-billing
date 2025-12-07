import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  Form,
  FormControl,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Shield, User, Plus, Building2, Edit } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  pagePermissions?: string[];
  createdAt: string;
}

interface Company {
  id: number;
  name: string;
}

interface UserCompany {
  id: number;
  companyId: number;
  isDefault: boolean;
  company: Company;
}

const editUserSchema = z.object({
  role: z.enum(["user", "admin", "superadmin"]),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  pagePermissions: z.array(z.string()).optional(),
});

type EditUserForm = z.infer<typeof editUserSchema>;

const PAGE_OPTIONS = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "parties", label: "Parties", icon: "👥" },
  { id: "items", label: "Items", icon: "📦" },
  { id: "agents", label: "Agents", icon: "🤝" },
  { id: "sales-b2b", label: "Sales - B2B", icon: "💼" },
  { id: "sales-b2c", label: "Sales - B2C Retail", icon: "💼" },
  { id: "sales-estimate", label: "Sales - Estimate", icon: "💼" },
  { id: "sales-credit-note", label: "Sales - Credit Note", icon: "💼" },
  { id: "sales-debit-note", label: "Sales - Debit Note", icon: "💼" },
  { id: "purchases", label: "Purchases", icon: "🛒" },
  { id: "stock", label: "Stock", icon: "📊" },
  { id: "payments", label: "Payments", icon: "💰" },
  { id: "reports", label: "Reports", icon: "📈" },
  { id: "barcode-management", label: "Barcode Management", icon: "📱" },
  { id: "bill-settings", label: "Bill Settings", icon: "⚙️" },
  { id: "users", label: "User Management", icon: "👤" },
];

// Helper function to get allowed pages based on role
const getFilteredPages = (role: string) => {
  if (role === "admin") {
    // Admin (Customer) can only assign User Management permission
    return PAGE_OPTIONS.filter((p) => p.id === "users");
  }
  // Super Admin and Normal User can see all pages
  return PAGE_OPTIONS;
};

const createUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  role: z.enum(["user", "admin", "superadmin"]),
  pagePermissions: z.array(z.string()).optional(),
  companyIds: z.array(z.number()).optional(),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

export default function UserManagement() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Only admins can access this page
  const isSuperAdmin = currentUser?.role === "superadmin";
  const isAdmin = isSuperAdmin || currentUser?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Shield className="w-12 h-12 mx-auto text-red-600" />
              <h2 className="text-2xl font-bold">Access Denied</h2>
              <p className="text-muted-foreground">
                Only Super Admin or Admin can access user management
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: companies } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const { data: selectedUserCompanies } = useQuery<UserCompany[]>({
    queryKey: ["/api/users", selectedUserId, "companies"],
    enabled: !!selectedUserId,
  });

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      password: "",
      firstName: "",
      lastName: "",
      email: "",
      role: "user",
      pagePermissions: [],
      companyIds: [],
    },
  });

  const editForm = useForm<EditUserForm>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      role: "user",
      password: "",
      pagePermissions: [],
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserForm) => {
      return apiRequest("POST", "/api/users/create", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "User created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return apiRequest("PUT", `/api/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const assignCompanyMutation = useMutation({
    mutationFn: async ({
      userId,
      companyId,
      isDefault,
    }: {
      userId: string;
      companyId: number;
      isDefault: boolean;
    }) => {
      return apiRequest("POST", `/api/users/${userId}/companies`, {
        companyId,
        isDefault,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/users", selectedUserId, "companies"],
      });
      toast({
        title: "Success",
        description: "Company assigned successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeCompanyMutation = useMutation({
    mutationFn: async ({
      userId,
      companyId,
    }: {
      userId: string;
      companyId: number;
    }) => {
      return apiRequest("DELETE", `/api/users/${userId}/companies/${companyId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/users", selectedUserId, "companies"],
      });
      toast({
        title: "Success",
        description: "Company removed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("DELETE", `/api/users/${userId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: async ({
      userId,
      role,
      pagePermissions,
    }: {
      userId: string;
      role: string;
      pagePermissions?: string[];
    }) => {
      return apiRequest("PUT", `/api/users/${userId}/permissions`, {
        role,
        pagePermissions,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setEditDialogOpen(false);
      setEditingUser(null);
      editForm.reset();
      toast({
        title: "Success",
        description: "User permissions updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async ({
      userId,
      password,
    }: {
      userId: string;
      password: string;
    }) => {
      return apiRequest("PUT", `/api/users/${userId}/password`, {
        password,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User password updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateUserForm) => {
    createUserMutation.mutate(data);
  };

  const onEditSubmit = (data: EditUserForm) => {
    if (editingUser) {
      updatePermissionsMutation.mutate({
        userId: editingUser.id,
        role: data.role,
        pagePermissions: data.pagePermissions,
      });
      
      if (data.password && data.password.trim()) {
        updatePasswordMutation.mutate({
          userId: editingUser.id,
          password: data.password,
        });
      }
    }
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    editForm.reset({
      role: user.role,
      pagePermissions: user.pagePermissions || [],
    });
    setEditDialogOpen(true);
  };

  const getRoleBadge = (role: string) => {
    if (role === "admin") {
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <Shield className="mr-1 h-3 w-3" />
          Super Admin
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        <User className="mr-1 h-3 w-3" />
        Normal User
      </Badge>
    );
  };

  const isCompanyAssigned = (companyId: number) => {
    return selectedUserCompanies?.some((uc) => uc.companyId === companyId);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage user roles and permissions (Super Admin only)
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              data-testid="button-create-user"
              disabled={!isAdmin}
              title={!isAdmin ? "Only admins can create users" : ""}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Create a new user account with username and password
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-username" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          data-testid="input-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-firstname" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-lastname" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-role">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="user">Normal User</SelectItem>
                          <SelectItem value="admin">Admin (Customer)</SelectItem>
                          {isSuperAdmin && <SelectItem value="superadmin">Super Admin</SelectItem>}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pagePermissions"
                  render={() => {
                    const selectedRole = form.watch("role");
                    const filteredPages = getFilteredPages(selectedRole);
                    return (
                      <FormItem>
                        <FormLabel>Page Access Permissions</FormLabel>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded">
                          {filteredPages.map((page) => (
                            <FormField
                              key={page.id}
                              control={form.control}
                              name="pagePermissions"
                              render={({ field }) => {
                                return (
                                  <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(page.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([
                                                ...(field.value || []),
                                                page.id,
                                              ])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== page.id
                                                )
                                              );
                                        }}
                                        data-testid={`checkbox-page-${page.id}`}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal text-xs">
                                      {page.label}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <FormField
                  control={form.control}
                  name="companyIds"
                  render={() => (
                    <FormItem>
                      <FormLabel>Assign Companies</FormLabel>
                      <div className="space-y-2">
                        {companies?.map((company) => (
                          <FormField
                            key={company.id}
                            control={form.control}
                            name="companyIds"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={company.id}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(company.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([
                                              ...(field.value || []),
                                              company.id,
                                            ])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== company.id
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {company.name}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createUserMutation.isPending}
                    data-testid="button-submit-user"
                  >
                    {createUserMutation.isPending ? "Creating..." : "Create User"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User Permissions</DialogTitle>
            <DialogDescription>
              Update role and page access permissions for {editingUser?.username}
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password (Leave blank to keep current)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Enter new password or leave blank"
                          data-testid={`input-edit-password-${editingUser.id}`}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid={`edit-select-role-${editingUser.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="user">Normal User</SelectItem>
                          <SelectItem value="admin">Admin (Customer)</SelectItem>
                          {isSuperAdmin && <SelectItem value="superadmin">Super Admin</SelectItem>}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="pagePermissions"
                  render={() => {
                    const selectedRole = editForm.watch("role");
                    const filteredPages = getFilteredPages(selectedRole);
                    return (
                      <FormItem>
                        <FormLabel>Page Access Permissions</FormLabel>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded">
                          {filteredPages.map((page) => (
                            <FormField
                              key={page.id}
                              control={editForm.control}
                              name="pagePermissions"
                              render={({ field }) => {
                                return (
                                  <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(page.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([
                                                ...(field.value || []),
                                                page.id,
                                              ])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== page.id
                                                )
                                              );
                                        }}
                                        data-testid={`edit-checkbox-page-${page.id}`}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal text-xs">
                                      {page.label}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updatePermissionsMutation.isPending}
                    data-testid="button-save-permissions"
                  >
                    {updatePermissionsMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Companies</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-sm" data-testid={`text-username-${user.id}`}>
                      {user.username}
                    </TableCell>
                    <TableCell data-testid={`text-name-${user.id}`}>
                      {user.firstName || user.lastName
                        ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRoleBadge(user.role)}
                        {user.id !== currentUser?.id && (
                          <Select
                            value={user.role}
                            onValueChange={(newRole) =>
                              updateRoleMutation.mutate({
                                userId: user.id,
                                role: newRole,
                              })
                            }
                          >
                            <SelectTrigger
                              className="w-[120px] text-xs"
                              data-testid={`select-role-${user.id}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">Normal User</SelectItem>
                              {isSuperAdmin && <SelectItem value="admin">Admin (Customer)</SelectItem>}
                              {isSuperAdmin && <SelectItem value="superadmin">Super Admin</SelectItem>}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedUserId(user.id)}
                            data-testid={`button-manage-companies-${user.id}`}
                          >
                            <Building2 className="mr-1 h-3 w-3" />
                            Manage
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Manage Company Access</DialogTitle>
                            <DialogDescription>
                              Assign or remove companies for {user.username}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-3">
                            <div className="text-sm font-medium">Assigned Companies:</div>
                            {selectedUserCompanies?.map((uc) => (
                              <div
                                key={uc.id}
                                className="flex items-center justify-between p-2 border rounded"
                              >
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4" />
                                  <span>{uc.company.name}</span>
                                  {uc.isDefault && (
                                    <Badge variant="outline" className="text-xs">
                                      Default
                                    </Badge>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    removeCompanyMutation.mutate({
                                      userId: user.id,
                                      companyId: uc.companyId,
                                    })
                                  }
                                  disabled={removeCompanyMutation.isPending}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                            <div className="text-sm font-medium mt-4">
                              Available Companies:
                            </div>
                            {companies
                              ?.filter((c) => !isCompanyAssigned(c.id))
                              .map((company) => (
                                <div
                                  key={company.id}
                                  className="flex items-center justify-between p-2 border rounded"
                                >
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    <span>{company.name}</span>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      assignCompanyMutation.mutate({
                                        userId: user.id,
                                        companyId: company.id,
                                        isDefault:
                                          selectedUserCompanies?.length === 0,
                                      })
                                    }
                                    disabled={assignCompanyMutation.isPending}
                                  >
                                    Assign
                                  </Button>
                                </div>
                              ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground" data-testid={`text-date-${user.id}`}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {user.id !== currentUser?.id && isAdmin && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEditClick(user)}
                            data-testid={`button-edit-${user.id}`}
                            title="Edit user permissions"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {user.id !== currentUser?.id && isAdmin && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (
                                confirm(
                                  "Are you sure you want to delete this user?"
                                )
                              ) {
                                deleteMutation.mutate(user.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-${user.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {users?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No users found
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">User Roles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <div className="font-semibold mb-1 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Super Admin
            </div>
            <p className="text-muted-foreground">
              Full access to all menus including user management, bill settings, and all reports
            </p>
          </div>
          <div>
            <div className="font-semibold mb-1 flex items-center gap-2">
              <User className="h-4 w-4" />
              Normal User
            </div>
            <p className="text-muted-foreground">
              Limited access to Dashboard, Sales Billing, Sales view, and basic reports only
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
