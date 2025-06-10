
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Calendar, Edit, Trash2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Production() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("scheduled");
  const { toast } = useToast();

  const {
    data: schedule = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/production"],
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error)) return false;
      return failureCount < 3;
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/production", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production"] });
      setIsDialogOpen(false);
      setEditingItem(null);
      toast({ title: "Success", description: "Production item scheduled successfully" });
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
        description: "Failed to schedule production item",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest("PUT", `/api/production/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production"] });
      setIsDialogOpen(false);
      setEditingItem(null);
      toast({ title: "Success", description: "Production item updated successfully" });
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
        description: "Failed to update production item",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/production/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production"] });
      toast({ title: "Success", description: "Production item deleted successfully" });
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
        description: "Failed to delete production item",
        variant: "destructive",
      });
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const productId = formData.get("productId") as string;
    const quantity = formData.get("quantity") as string;
    const scheduledDateStr = formData.get("scheduledDate") as string;
    
    if (!productId) {
      toast({
        title: "Error",
        description: "Product is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!quantity || parseInt(quantity) <= 0) {
      toast({
        title: "Error",
        description: "Valid quantity is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!scheduledDateStr) {
      toast({
        title: "Error",
        description: "Scheduled date is required",
        variant: "destructive",
      });
      return;
    }
    
    const scheduledDate = new Date(scheduledDateStr);
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;
    
    // Combine date with times
    let startDateTime = null;
    let endDateTime = null;
    
    if (startTime) {
      startDateTime = new Date(scheduledDate);
      const [hours, minutes] = startTime.split(':');
      startDateTime.setHours(parseInt(hours), parseInt(minutes));
    }
    
    if (endTime) {
      endDateTime = new Date(scheduledDate);
      const [hours, minutes] = endTime.split(':');
      endDateTime.setHours(parseInt(hours), parseInt(minutes));
    }

    const data = {
      productId: parseInt(productId),
      quantity: parseInt(quantity),
      scheduledDate: scheduledDate,
      startTime: startDateTime,
      endTime: endDateTime,
      status: (formData.get("status") as string) || "scheduled",
      notes: (formData.get("notes") as string)?.trim() || null,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      scheduled: "outline",
      in_progress: "secondary", 
      completed: "default",
      cancelled: "destructive",
    };
    return variants[status] || "outline";
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
          <h1 className="text-2xl sm:text-3xl font-bold">Production Schedule</h1>
          <p className="text-muted-foreground">
            Plan and track your production activities
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingItem(null);
            setSelectedProduct("");
            setSelectedStatus("scheduled");
          }
        }}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingItem(null);
                setSelectedProduct("");
                setSelectedStatus("scheduled");
              }}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Schedule Production
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Production Item" : "Schedule New Production"}
              </DialogTitle>
              <DialogDescription>Enter production details below</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Select
                  value={selectedProduct}
                  onValueChange={setSelectedProduct}
                  defaultValue={editingItem?.productId?.toString() || ""}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product: any) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" name="productId" value={selectedProduct} />
              </div>
              <Input
                name="quantity"
                type="number"
                placeholder="Quantity"
                defaultValue={editingItem?.quantity || ""}
                required
              />
              <Input
                name="scheduledDate"
                type="date"
                defaultValue={
                  editingItem?.scheduledDate
                    ? new Date(editingItem.scheduledDate).toISOString().split("T")[0]
                    : ""
                }
                required
              />
              <Input
                name="startTime"
                type="time"
                placeholder="Start Time"
                defaultValue={
                  editingItem?.startTime
                    ? new Date(editingItem.startTime).toTimeString().slice(0, 5)
                    : ""
                }
              />
              <Input
                name="endTime"
                type="time"
                placeholder="End Time"
                defaultValue={
                  editingItem?.endTime
                    ? new Date(editingItem.endTime).toTimeString().slice(0, 5)
                    : ""
                }
              />
              <div>
                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                  defaultValue={editingItem?.status || "scheduled"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <input type="hidden" name="status" value={selectedStatus} />
              </div>
              <Textarea
                name="notes"
                placeholder="Notes (optional)"
                defaultValue={editingItem?.notes || ""}
                rows={3}
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
                  {editingItem ? "Update" : "Schedule"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Production Schedule</CardTitle>
          <CardDescription>Manage your production timeline</CardDescription>
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
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="hidden md:table-cell">Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedule.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{item.productName}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.assignedUserName && `Assigned to: ${item.assignedUserName}`}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{item.quantity}</TableCell>
                      <TableCell>
                        {new Date(item.scheduledDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-1" />
                          {item.startTime && item.endTime ? (
                            <>
                              {new Date(item.startTime).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                              {" - "}
                              {new Date(item.endTime).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </>
                          ) : (
                            "Not set"
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(item.status)}>
                          {item.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingItem(item);
                              setSelectedProduct(item.productId?.toString() || "");
                              setSelectedStatus(item.status || "scheduled");
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
                  ))}
                </TableBody>
              </Table>
              {schedule.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                    No production scheduled
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Start by scheduling your first production item
                  </p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Production
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
