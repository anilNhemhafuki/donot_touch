import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  CardHeader,
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

import EnhancedProductionSchedule from "@/components/enhanced-production-schedule";

export default function Production() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    productId: "",
    quantity: "",
    scheduledDate: "",
    startTime: "",
    endTime: "",
    status: "scheduled",
    notes: "",
  });

  const { toast } = useToast();

  // Fetch production items
  const { data: productionItems = [], isLoading } = useQuery({
    queryKey: ["productionItems"],
    queryFn: async () => {
      const res = await apiRequest("/api/production");
      return res.data;
    },
  });

  // Fetch products for dropdown
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await apiRequest("/api/products");
      return res.data;
    },
  });

  // Create or update production item
  const mutation = useMutation({
    mutationFn: async (data) => {
      if (editingId) {
        const res = await apiRequest(
          `/api/production/${editingId}`,
          "PUT",
          data,
        );
        return res;
      } else {
        const res = await apiRequest("/api/production", "POST", data);
        return res;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productionItems"] });
      toast({
        title: editingId ? "Updated!" : "Created!",
        description: editingId
          ? "Production item updated successfully."
          : "New production scheduled.",
      });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Error",
          description: "You're not authorized.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save production.",
          variant: "destructive",
        });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await apiRequest(`/api/production/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productionItems"] });
      toast({ title: "Deleted!", description: "Production item removed." });
    },
  });

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      productId: item.product?._id || item.productId,
      quantity: item.quantity,
      scheduledDate: new Date(item.scheduledDate).toISOString().split("T")[0],
      startTime: new Date(item.startTime || item.scheduledDate)
        .toTimeString()
        .slice(0, 5),
      endTime: new Date(item.endTime || "").toTimeString().slice(0, 5),
      status: item.status,
      notes: item.notes || "",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setForm({
      productId: "",
      quantity: "",
      scheduledDate: "",
      startTime: "",
      endTime: "",
      status: "scheduled",
      notes: "",
    });
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.productId || !form.quantity || !form.scheduledDate) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Ensure quantity is a number
    const numericQuantity = Number(form.quantity);
    if (isNaN(numericQuantity) || numericQuantity <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Quantity must be a positive number.",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate({
      ...form,
      quantity: numericQuantity,
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">
            Production Schedule
          </h1>
          <p className="text-muted-foreground">
            Plan and track your production activities
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Schedule Production
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Production Item" : "Schedule New Production"}
              </DialogTitle>
              <DialogDescription>
                Enter production details below
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Select
                  value={form.productId}
                  onValueChange={(value) =>
                    setForm({ ...form, productId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product._id} value={product._id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" name="productId" value={form.productId} />
              </div>
              <Input
                name="quantity"
                type="number"
                min="1"
                placeholder="Quantity"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                required
              />
              <Input
                name="scheduledDate"
                type="date"
                value={form.scheduledDate}
                onChange={(e) =>
                  setForm({ ...form, scheduledDate: e.target.value })
                }
                required
              />
              <Input
                name="startTime"
                type="time"
                placeholder="Start Time"
                value={form.startTime}
                onChange={(e) =>
                  setForm({ ...form, startTime: e.target.value })
                }
              />
              <Input
                name="endTime"
                type="time"
                placeholder="End Time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              />
              <div>
                <Select
                  value={form.status}
                  onValueChange={(value) => setForm({ ...form, status: value })}
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
              </div>
              <Textarea
                name="notes"
                placeholder="Notes (optional)"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
              />
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {mutation.isPending
                    ? "Saving..."
                    : editingId
                      ? "Update"
                      : "Schedule"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Simple Table View */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Production</CardTitle>
          <CardDescription>Manage scheduled production items</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productionItems.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>{item.product?.name || "Unknown"}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>
                    {new Date(item.scheduledDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.status === "completed" ? "default" : "secondary"
                      }
                    >
                      {item.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(item._id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EnhancedProductionSchedule />
    </div>
  );
}
