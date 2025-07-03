import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function AdminUserManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userData, setUserData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "staff",
  });
  const { toast } = useToast();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: () => apiRequest("/api/admin/users"),
  });

  const { data: allPermissions = [] } = useAllPermissions();
  const { data: rolePermissions = [], refetch: refetchRolePermissions } = useRolePermissions(selectedRole);

  const updateRolePermissionsMutation = useMutation({
    mutationFn: async ({ role, permissionIds }: { role: string; permissionIds: number[] }) => {
      return apiRequest(`/api/permissions/role/${role}`, {
        method: "PUT",
        body: JSON.stringify({ permissionIds }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      toast({ title: "Role permissions updated successfully" });
      refetchRolePermissions();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update permissions",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/admin/users", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsDialogOpen(false);
      setEditingUser(null);
      setUserData({ email: "", password: "", firstName: "", lastName: "", role: "staff" });
      toast({
        title: "Success",
        description: "User created successfully",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest("PUT", `/api/admin/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsDialogOpen(false);
      setEditingUser(null);
      setUserData({ email: "", password: "", firstName: "", lastName: "", role: "staff" });
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      email: formData.get("email") as string,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      role: formData.get("role") as string,
      ...((!editingUser || formData.get("password")) && { 
        password: formData.get("password") as string 
      }),
    };

    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setUserData({
      email: user.email,
      password: "",
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });
    setIsDialogOpen(true);
  };

  const getRoleBadgeVariant = (role: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      admin: "destructive",
      manager: "default",
      supervisor: "secondary",
      marketer: "outline",
      staff: "outline",
    };
    return variants[role] || "outline";
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      deleteMutation.mutate(userId);
    }
  };

  const handlePermissionChange = (permissionId: number, checked: boolean) => {
    const currentPermissionIds = rolePermissions.map((p: any) => p.id);
    let newPermissionIds;

    if (checked) {
      newPermissionIds = [...currentPermissionIds, permissionId];
    } else {
      newPermissionIds = currentPermissionIds.filter((id: number) => id !== permissionId);
    }

    updateRolePermissionsMutation.mutate({
      role: selectedRole,
      permissionIds: newPermissionIds,
    });
  };

  const groupPermissionsByResource = (permissions: any[]) => {
    const grouped = permissions.reduce((acc: any, perm: any) => {
      if (!acc[perm.resource]) {
        acc[perm.resource] = [];
      }
      acc[perm.resource].push(perm);
      return acc;
    }, {});
    return grouped;
  };

  if (error) {
    if (isUnauthorizedError(error) || error.message.includes('403') || error.message.includes('404')) {
      return (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
              <p>You don't have permission to access user management.</p>
              <p className="text-sm mt-2">Contact your administrator for access.</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p>Error loading user management: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>Manage users and their roles</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingUser(null);
              setUserData({ email: "", password: "", firstName: "", lastName: "", role: "staff" });
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? "Edit User" : "Create New User"}
                </DialogTitle>
                <DialogDescription>
                  {editingUser ? "Update user information" : "Add a new user to the system"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      defaultValue={userData.firstName}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      defaultValue={userData.lastName}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={userData.email}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">
                    Password {editingUser && "(leave blank to keep current)"}
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required={!editingUser}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select name="role" defaultValue={userData.role}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="marketer">Marketer</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingUser ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(user.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {users.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                  No users found
                </h3>
                <p className="text-muted-foreground mb-4">
                  Start by adding your first user
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}