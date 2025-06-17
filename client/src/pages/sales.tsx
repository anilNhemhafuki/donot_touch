import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Receipt, Search, Filter } from "lucide-react";
import { format } from "date-fns";

interface Sale {
  id: number;
  customerName: string;
  totalAmount: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
  items: SaleItem[];
}

interface SaleItem {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
}

export default function Sales() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["/api/sales"],
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
  });

  const [saleForm, setSaleForm] = useState({
    customerId: "",
    customerName: "",
    paymentMethod: "cash",
    items: [{ productId: "", quantity: 1, unitPrice: "0" }],
  });

  const createSaleMutation = useMutation({
    mutationFn: async (saleData: any) => {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(saleData),
      });
      if (!response.ok) throw new Error("Failed to create sale");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({ title: "Success", description: "Sale recorded successfully" });
      handleCloseDialog();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record sale",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const totalAmount = saleForm.items.reduce((sum, item) => {
      const itemTotal = parseFloat(item.unitPrice) * item.quantity;
      return sum + itemTotal;
    }, 0);

    const saleData = {
      customerId: saleForm.customerId ? parseInt(saleForm.customerId) : null,
      customerName: saleForm.customerName,
      totalAmount: totalAmount.toString(),
      paymentMethod: saleForm.paymentMethod,
      status: "completed",
      items: saleForm.items.map((item) => ({
        productId: parseInt(item.productId),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: (parseFloat(item.unitPrice) * item.quantity).toString(),
      })),
    };

    createSaleMutation.mutate(saleData);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSaleForm({
      customerId: "",
      customerName: "",
      paymentMethod: "cash",
      items: [{ productId: "", quantity: 1, unitPrice: "0" }],
    });
  };

  const addItem = () => {
    setSaleForm({
      ...saleForm,
      items: [
        ...saleForm.items,
        { productId: "", quantity: 1, unitPrice: "0" },
      ],
    });
  };

  const removeItem = (index: number) => {
    setSaleForm({
      ...saleForm,
      items: saleForm.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = saleForm.items.map((item, i) => {
      if (i === index) {
        if (field === "productId") {
          const product = products.find((p: any) => p.id === parseInt(value));
          return {
            ...item,
            productId: value,
            unitPrice: product?.price || "0",
          };
        }
        return { ...item, [field]: value };
      }
      return item;
    });
    setSaleForm({ ...saleForm, items: updatedItems });
  };

  const filteredSales = sales.filter((sale: Sale) => {
    const matchesSearch = sale.customerName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || sale.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalSales = sales.reduce(
    (sum: number, sale: Sale) => sum + parseFloat(sale.totalAmount),
    0,
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading sales...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales Management</h1>
          <p className="text-muted-foreground">
            Record and track all sales transactions
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Record Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Record New Sale</DialogTitle>
              <DialogDescription>
                Enter the sale transaction details
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer">Customer</Label>
                  <Select
                    value={saleForm.customerId}
                    onValueChange={(value) => {
                      const customer = customers.find(
                        (c: any) => c.id === parseInt(value),
                      );
                      setSaleForm({
                        ...saleForm,
                        customerId: value,
                        customerName: customer?.name || "",
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer: any) => (
                        <SelectItem
                          key={customer.id}
                          value={customer.id.toString()}
                        >
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    value={saleForm.customerName}
                    onChange={(e) =>
                      setSaleForm({ ...saleForm, customerName: e.target.value })
                    }
                    placeholder="Enter customer name"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={saleForm.paymentMethod}
                  onValueChange={(value) =>
                    setSaleForm({ ...saleForm, paymentMethod: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Items</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addItem}
                  >
                    Add Item
                  </Button>
                </div>
                {saleForm.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                    <div className="col-span-5">
                      <Select
                        value={item.productId}
                        onValueChange={(value) =>
                          updateItem(index, "productId", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product: any) => (
                            <SelectItem
                              key={product.id}
                              value={product.id.toString()}
                            >
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "quantity",
                            parseInt(e.target.value),
                          )
                        }
                        min="1"
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(index, "unitPrice", e.target.value)
                        }
                        placeholder="Price"
                      />
                    </div>
                    <div className="col-span-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(index)}
                        disabled={saleForm.items.length === 1}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createSaleMutation.isPending}>
                  Record Sale
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rs. {totalSales.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sales.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rs.{" "}
              {sales
                .filter(
                  (sale: Sale) =>
                    new Date(sale.createdAt).toDateString() ===
                    new Date().toDateString(),
                )
                .reduce(
                  (sum: number, sale: Sale) =>
                    sum + parseFloat(sale.totalAmount),
                  0,
                )
                .toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Sale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rs.{" "}
              {sales.length > 0
                ? (totalSales / sales.length).toLocaleString()
                : "0"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Sales History</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sales..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[200px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredSales.map((sale: Sale) => (
              <div key={sale.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    <span className="font-medium">{sale.customerName}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      Rs. {parseFloat(sale.totalAmount).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(sale.createdAt), "MMM dd, yyyy")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{sale.paymentMethod?.toUpperCase() ?? "N/A"}</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      sale.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : sale.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {sale.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {filteredSales.length === 0 && (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No sales found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Start by recording your first sale"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
