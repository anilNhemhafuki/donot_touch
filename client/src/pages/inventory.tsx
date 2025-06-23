
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const { toast } = useToast();

  const {
    data: items = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/inventory"],
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error)) return false;
      return failureCount < 3;
    },
  });

  const { data: units = [] } = useQuery({
    queryKey: ["/api/units"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Creating stock item:", data);
      // Validate required fields before sending
      if (!data.name?.trim()) {
        throw new Error("Item name is required");
      }
      if (!data.unit?.trim()) {
        throw new Error("Unit is required");
      }
      if (isNaN(parseFloat(data.currentStock)) || parseFloat(data.currentStock) < 0) {
        throw new Error("Valid current stock is required");
      }
      if (isNaN(parseFloat(data.minLevel)) || parseFloat(data.minLevel) < 0) {
        throw new Error("Valid minimum level is required");
      }
      if (isNaN(parseFloat(data.costPerUnit)) || parseFloat(data.costPerUnit) < 0) {
        throw new Error("Valid cost per unit is required");
      }

      // Add today's date for new stock items
      const stockData = {
        ...data,
        dateAdded: new Date().toISOString(),
        lastRestocked: new Date().toISOString(),
      };
      return apiRequest("POST", "/api/inventory", stockData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Stock item saved successfully",
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
        description: error.message || "Failed to save stock item",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; values: any }) => {
      console.log("Updating stock item:", data);
      // Validate required fields before sending
      const values = data.values;
      if (!values.name?.trim()) {
        throw new Error("Item name is required");
      }
      if (!values.unit?.trim()) {
        throw new Error("Unit is required");
      }
      if (isNaN(parseFloat(values.currentStock)) || parseFloat(values.currentStock) < 0) {
        throw new Error("Valid current stock is required");
      }
      if (isNaN(parseFloat(values.minLevel)) || parseFloat(values.minLevel) < 0) {
        throw new Error("Valid minimum level is required");
      }
      if (isNaN(parseFloat(values.costPerUnit)) || parseFloat(values.costPerUnit) < 0) {
        throw new Error("Valid cost per unit is required");
      }

      // Add today's date for stock updates
      const updateData = {
        ...values,
        dateUpdated: new Date().toISOString(),
      };
      return apiRequest("PUT", `/api/inventory/${data.id}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsDialogOpen(false);
      setEditingItem(null);
      toast({
        title: "Success",
        description: "Stock item updated successfully",
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
        description: error.message || "Failed to update stock item",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/inventory/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({
        title: "Success",
        description: "Stock item deleted successfully",
      });
    },
    onError: (error) => {
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
        description: "Failed to delete stock item",
        variant: "destructive",
      });
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    const name = formData.get("name") as string;
    const unit = formData.get("unit") as string;
    const currentStock = formData.get("currentStock") as string;
    const minLevel = formData.get("minLevel") as string;
    const costPerUnit = formData.get("costPerUnit") as string;

    // Client-side validation
    if (!name?.trim()) {
      toast({
        title: "Error",
        description: "Item name is required",
        variant: "destructive",
      });
      return;
    }

    if (!unit?.trim()) {
      toast({
        title: "Error",
        description: "Unit is required",
        variant: "destructive",
      });
      return;
    }

    if (!currentStock || isNaN(parseFloat(currentStock)) || parseFloat(currentStock) < 0) {
      toast({
        title: "Error",
        description: "Valid current stock is required",
        variant: "destructive",
      });
      return;
    }

    if (!minLevel || isNaN(parseFloat(minLevel)) || parseFloat(minLevel) < 0) {
      toast({
        title: "Error",
        description: "Valid minimum level is required",
        variant: "destructive",
      });
      return;
    }

    if (!costPerUnit || isNaN(parseFloat(costPerUnit)) || parseFloat(costPerUnit) < 0) {
      toast({
        title: "Error",
        description: "Valid cost per unit is required",
        variant: "destructive",
      });
      return;
    }

    const data = {
      name: name.trim(),
      currentStock: parseFloat(currentStock),
      minLevel: parseFloat(minLevel),
      unit: unit.trim(),
      costPerUnit: parseFloat(costPerUnit),
      supplier: (formData.get("supplier") as string)?.trim() || null,
      company: (formData.get("company") as string)?.trim() || null,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, values: data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredItems = (items as any[]).filter(
    (item: any) =>
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supplier?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getStockBadge = (item: any) => {
    const currentStock = parseFloat(item.currentStock || 0);
    const minLevel = parseFloat(item.minLevel || 0);

    if (currentStock <= minLevel) {
      return { variant: "destructive" as const, text: "Low Stock" };
    } else if (currentStock <= minLevel * 1.5) {
      return { variant: "secondary" as const, text: "Warning" };
    }
    return { variant: "default" as const, text: "In Stock" };
  };

  if (error && isUnauthorizedError(error)) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
    return null;
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">
            Stock Management
          </h1>
          <p className="text-muted-foreground">
            Track your ingredients and raw materials
          </p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingItem(null);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              onClick={() => setEditingItem(null)}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Stock Item" : "Add New Stock Item"}
              </DialogTitle>
              <DialogDescription>Enter item details below</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <Input
                name="name"
                placeholder="Item Name"
                defaultValue={editingItem?.name || ""}
                required
              />
              <Input
                name="currentStock"
                type="number"
                step="0.01"
                min="0"
                placeholder="Current Stock"
                defaultValue={editingItem?.currentStock || ""}
                required
              />
              <Input
                name="minLevel"
                type="number"
                step="0.01"
                min="0"
                placeholder="Minimum Level"
                defaultValue={editingItem?.minLevel || ""}
                required
              />
              <Input
                name="unit"
                placeholder="Unit (e.g., kg, lbs, pieces)"
                defaultValue={editingItem?.unit || ""}
                required
              />
              <Input
                name="costPerUnit"
                type="number"
                step="0.01"
                min="0"
                placeholder="Cost Per Unit ($)"
                defaultValue={editingItem?.costPerUnit || ""}
                required
              />
              <Input
                name="supplier"
                placeholder="Supplier (optional)"
                defaultValue={editingItem?.supplier || ""}
              />
              <Input
                name="company"
                placeholder="Company (optional)"
                defaultValue={editingItem?.company || ""}
              />
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="w-full sm:w-auto"
                >
                  {editingItem ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Stock Items</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
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
                    <TableHead>Item</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Cost/Unit
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item: any) => {
                    const stockInfo = getStockBadge(item);
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <Package className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {item.supplier || "No supplier"}
                                {item.company && (
                                  <span className="block">{item.company}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {parseFloat(item.currentStock || 0).toFixed(2)}{" "}
                            {item.unit}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Min: {parseFloat(item.minLevel || 0).toFixed(2)}{" "}
                            {item.unit}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          ${parseFloat(item.costPerUnit || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={stockInfo.variant}>
                            {stockInfo.text}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingItem(item);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteMutation.mutate(item.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {filteredItems.length === 0 && (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                    No stock items found
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery
                      ? "Try adjusting your search criteria"
                      : "Start by adding your first stock item"}
                  </p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
