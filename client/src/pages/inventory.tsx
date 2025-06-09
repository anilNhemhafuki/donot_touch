import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInventoryItemSchema } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { z } from "zod";

const inventoryFormSchema = insertInventoryItemSchema.extend({
  name: z.string().min(1, "Name is required"),
  currentStock: z.string().min(1, "Current stock is required"),
  minLevel: z.string().min(1, "Minimum level is required"),
  unit: z.string().min(1, "Unit is required"),
  costPerUnit: z.string().min(1, "Cost per unit is required"),
});

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const { toast } = useToast();

  const { data: inventoryItems = [], isLoading, error } = useQuery({
    queryKey: ["/api/inventory"],
  });

  const { data: lowStockItems = [] } = useQuery({
    queryKey: ["/api/dashboard/low-stock"],
  });

  const form = useForm({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      name: "",
      currentStock: "",
      minLevel: "",
      unit: "",
      costPerUnit: "",
      supplier: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const transformedData = {
        ...data,
        currentStock: parseFloat(data.currentStock),
        minLevel: parseFloat(data.minLevel),
        costPerUnit: parseFloat(data.costPerUnit),
      };
      
      if (editingItem) {
        await apiRequest("PUT", `/api/inventory/${editingItem.id}`, transformedData);
      } else {
        await apiRequest("POST", "/api/inventory", transformedData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/low-stock"] });
      setShowAddForm(false);
      setEditingItem(null);
      form.reset();
      toast({
        title: "Success",
        description: editingItem ? "Inventory item updated successfully" : "Inventory item created successfully",
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
        description: editingItem ? "Failed to update inventory item" : "Failed to create inventory item",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/inventory/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/low-stock"] });
      toast({
        title: "Success",
        description: "Inventory item deleted successfully",
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
        description: "Failed to delete inventory item",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (item: any) => {
    setEditingItem(item);
    form.reset({
      name: item.name,
      currentStock: item.currentStock.toString(),
      minLevel: item.minLevel.toString(),
      unit: item.unit,
      costPerUnit: item.costPerUnit.toString(),
      supplier: item.supplier || "",
    });
    setShowAddForm(true);
  };

  const getStockStatus = (current: number, min: number) => {
    if (current === 0) return { label: "Out of Stock", class: "bg-red-100 text-red-800" };
    if (current <= min) return { label: "Critical", class: "bg-red-100 text-red-800" };
    if (current <= min * 1.5) return { label: "Low Stock", class: "bg-yellow-100 text-yellow-800" };
    return { label: "In Stock", class: "bg-green-100 text-green-800" };
  };

  const filteredItems = inventoryItems.filter((item: any) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.supplier?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Track your ingredients and supplies</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <i className="fas fa-plus mr-2"></i>
          Add Item
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Inventory Overview</CardTitle>
                <Input
                  placeholder="Search inventory..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
              </div>
            </CardHeader>
            <CardContent>
              {filteredItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Ingredient</th>
                        <th className="text-left py-2">Current Stock</th>
                        <th className="text-left py-2">Min Level</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-left py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item: any) => {
                        const current = Number(item.currentStock);
                        const min = Number(item.minLevel);
                        const status = getStockStatus(current, min);
                        
                        return (
                          <tr key={item.id} className="border-b hover:bg-gray-50">
                            <td className="py-3">
                              <div>
                                <div className="font-medium">{item.name}</div>
                                {item.supplier && (
                                  <div className="text-sm text-gray-500">
                                    Supplier: {item.supplier}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3">
                              {current.toFixed(1)} {item.unit}
                            </td>
                            <td className="py-3">
                              {min.toFixed(1)} {item.unit}
                            </td>
                            <td className="py-3">
                              <Badge className={status.class}>
                                {status.label}
                              </Badge>
                            </td>
                            <td className="py-3">
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(item)}
                                >
                                  <i className="fas fa-edit"></i>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => deleteMutation.mutate(item.id)}
                                  disabled={deleteMutation.isPending}
                                >
                                  <i className="fas fa-trash"></i>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="fas fa-boxes text-4xl text-gray-300 mb-4"></i>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No inventory items found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery ? "Try adjusting your search" : "Start by adding your first inventory item"}
                  </p>
                  <Button onClick={() => setShowAddForm(true)}>
                    <i className="fas fa-plus mr-2"></i>
                    Add Item
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Low Stock Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-orange-600">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStockItems.length > 0 ? (
                  lowStockItems.slice(0, 5).map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div>
                        <p className="font-medium text-orange-800">{item.name}</p>
                        <p className="text-sm text-orange-600">
                          {Number(item.currentStock).toFixed(1)} {item.unit} remaining
                        </p>
                      </div>
                      <i className="fas fa-exclamation-triangle text-orange-600"></i>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <i className="fas fa-check-circle text-2xl text-green-500 mb-2"></i>
                    <p className="text-sm text-gray-600">All items are well stocked</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <i className="fas fa-upload mr-2"></i>
                  Import Data
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <i className="fas fa-download mr-2"></i>
                  Export Report
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <i className="fas fa-shopping-cart mr-2"></i>
                  Generate Purchase Order
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      <Dialog open={showAddForm} onOpenChange={(open) => {
        setShowAddForm(open);
        if (!open) {
          setEditingItem(null);
          form.reset();
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Inventory Item" : "Add New Inventory Item"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <Input placeholder="All-Purpose Flour" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="currentStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Stock</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="50.5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Level</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <FormControl>
                        <Input placeholder="lbs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="costPerUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost per Unit ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="2.50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC Wholesale" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingItem(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <i className="fas fa-spinner fa-spin mr-2"></i>}
                  {editingItem ? "Update" : "Add"} Item
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
