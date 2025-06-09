import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductionScheduleItemSchema } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { z } from "zod";

const productionFormSchema = insertProductionScheduleItemSchema.extend({
  productId: z.string().min(1, "Product is required"),
  quantity: z.string().min(1, "Quantity is required"),
  scheduledDate: z.string().min(1, "Scheduled date is required"),
  startTime: z.string().optional(),
});

export default function Production() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const { data: productionSchedule = [], isLoading, error } = useQuery({
    queryKey: ["/api/production"],
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const form = useForm({
    resolver: zodResolver(productionFormSchema),
    defaultValues: {
      productId: "",
      quantity: "",
      scheduledDate: "",
      startTime: "",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const transformedData = {
        ...data,
        productId: parseInt(data.productId),
        quantity: parseInt(data.quantity),
        scheduledDate: new Date(data.scheduledDate),
        startTime: data.startTime ? new Date(`${data.scheduledDate}T${data.startTime}`) : null,
      };
      
      if (editingItem) {
        await apiRequest("PUT", `/api/production/${editingItem.id}`, transformedData);
      } else {
        await apiRequest("POST", "/api/production", transformedData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/production-schedule"] });
      setShowAddForm(false);
      setEditingItem(null);
      form.reset();
      toast({
        title: "Success",
        description: editingItem ? "Production item updated successfully" : "Production item scheduled successfully",
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
        description: editingItem ? "Failed to update production item" : "Failed to schedule production item",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, startTime, endTime }: { id: number; status: string; startTime?: Date; endTime?: Date }) => {
      const updateData: any = { status };
      if (startTime) updateData.startTime = startTime;
      if (endTime) updateData.endTime = endTime;
      
      await apiRequest("PUT", `/api/production/${id}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/production-schedule"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Production status updated successfully",
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
        description: "Failed to update production status",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (item: any) => {
    setEditingItem(item);
    const scheduledDate = new Date(item.scheduledDate).toISOString().split('T')[0];
    const startTime = item.startTime ? new Date(item.startTime).toISOString().slice(11, 16) : "";
    
    form.reset({
      productId: item.productId.toString(),
      quantity: item.quantity.toString(),
      scheduledDate,
      startTime,
      notes: item.notes || "",
    });
    setShowAddForm(true);
  };

  const handleStatusUpdate = (id: number, currentStatus: string) => {
    const now = new Date();
    
    if (currentStatus === "scheduled") {
      updateStatusMutation.mutate({ id, status: "in_progress", startTime: now });
    } else if (currentStatus === "in_progress") {
      updateStatusMutation.mutate({ id, status: "completed", endTime: now });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      in_progress: "secondary",
      scheduled: "outline",
      cancelled: "destructive"
    };
    
    const labels: Record<string, string> = {
      completed: "Completed",
      in_progress: "In Progress", 
      scheduled: "Scheduled",
      cancelled: "Cancelled"
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const filteredItems = productionSchedule.filter((item: any) => {
    return statusFilter === "all" || item.status === statusFilter;
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
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
          <h1 className="text-2xl font-bold text-gray-900">Production Schedule</h1>
          <p className="text-gray-600">Plan and track your bakery production</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <i className="fas fa-plus mr-2"></i>
          Schedule Production
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Production Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Production Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3">Product</th>
                    <th className="text-left py-3">Quantity</th>
                    <th className="text-left py-3">Scheduled Date</th>
                    <th className="text-left py-3">Start Time</th>
                    <th className="text-left py-3">Status</th>
                    <th className="text-left py-3">Assigned To</th>
                    <th className="text-left py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item: any) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="py-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center mr-3">
                            <i className="fas fa-cookie-bite text-primary text-sm"></i>
                          </div>
                          <span className="font-medium">{item.productName}</span>
                        </div>
                      </td>
                      <td className="py-3">{item.quantity} items</td>
                      <td className="py-3">
                        {new Date(item.scheduledDate).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        {item.startTime ? new Date(item.startTime).toLocaleTimeString() : 'Not started'}
                      </td>
                      <td className="py-3">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="py-3">
                        {item.assignedUserName || 'Unassigned'}
                      </td>
                      <td className="py-3">
                        <div className="flex space-x-2">
                          {item.status === "scheduled" && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(item.id, item.status)}
                              disabled={updateStatusMutation.isPending}
                            >
                              <i className="fas fa-play mr-1"></i>
                              Start
                            </Button>
                          )}
                          {item.status === "in_progress" && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(item.id, item.status)}
                              disabled={updateStatusMutation.isPending}
                            >
                              <i className="fas fa-check mr-1"></i>
                              Complete
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item)}
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          {item.status !== "completed" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateStatusMutation.mutate({ id: item.id, status: "cancelled" })}
                              disabled={updateStatusMutation.isPending}
                            >
                              <i className="fas fa-times"></i>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <i className="fas fa-industry text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No production scheduled</h3>
              <p className="text-gray-500 mb-4">
                {statusFilter !== "all" 
                  ? "No items found for the selected status"
                  : "Start by scheduling your first production batch"
                }
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <i className="fas fa-plus mr-2"></i>
                Schedule Production
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
              {editingItem ? "Edit Production Item" : "Schedule Production"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products.map((product: any) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="24" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="scheduledDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scheduled Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time (Optional)</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Special instructions..." {...field} />
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
                  {editingItem ? "Update" : "Schedule"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
