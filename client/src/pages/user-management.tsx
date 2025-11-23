import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Trash2, Shield, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  createdAt: string;
}

export default function UserManagement() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
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

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">User Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage user roles and permissions (Super Admin only)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-sm" data-testid={`text-email-${user.id}`}>
                      {user.email}
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
                              <SelectItem value="admin">Super Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground" data-testid={`text-date-${user.id}`}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {user.id !== currentUser?.id && (
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
