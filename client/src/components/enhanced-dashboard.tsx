import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Edit,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import AdminUserManagement from "./admin-user-management";
import { useAuth } from "@/hooks/useAuth";

interface ProductionItem {
  id?: number;
  serialNo: number;
  productionName: string;
  quantity: number;
  unit: string;
  total: number;
  status?: string;
}

export default function EnhancedDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isProductionDialogOpen, setIsProductionDialogOpen] = useState(false);
  const [editingProduction, setEditingProduction] = useState<any>(null);
  const [productionSchedule, setProductionSchedule] = useState<any[]>([]);

  const { data: stats = {} } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentOrders = [] } = useQuery({
    queryKey: ["/api/dashboard/recent-orders"],
  });

  const { data: lowStockItems = [] } = useQuery({
    queryKey: ["/api/dashboard/low-stock"],
  });

  const { data: todayProduction = [] } = useQuery({
    queryKey: ["/api/dashboard/production-schedule"],
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const createProductionMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/production", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/dashboard/production-schedule"],
      });
      setIsProductionDialogOpen(false);
      setEditingProduction(null);
      toast({
        title: "Success",
        description: "Production item saved successfully",
      });
    },
  });

  const quickActions = [
    {
      title: "add" + " " + "products",
      description: "Add new bakery products",
      icon: Package,
      color: "bg-blue-500",
      action: () => (window.location.href = "/products"),
    },
    {
      title: "add" + " Order",
      description: "Create new customer order",
      icon: ShoppingCart,
      color: "bg-green-500",
      action: () => (window.location.href = "/orders"),
    },
    {
      title: "add" + " " + "customers",
      description: "Add new customer",
      icon: Users,
      color: "bg-purple-500",
      action: () => (window.location.href = "/customers"),
    },
    {
      title: "View " + "reports",
      description: "Generate reports",
      icon: TrendingUp,
      color: "bg-orange-500",
      action: () => (window.location.href = "/reports"),
    },
  ];

  const addProductionItem = () => {
    const newItem: ProductionItem = {
      serialNo: productionSchedule.length + 1,
      productionName: "",
      quantity: 0,
      unit: "pcs",
      total: 0,
    };
    setEditingProduction(newItem);
    setIsProductionDialogOpen(true);
  };

  const editProductionItem = (item: ProductionItem) => {
    setEditingProduction(item);
    setIsProductionDialogOpen(true);
  };

  const saveProductionItem = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const productId = parseInt(formData.get("productId") as string);
    const quantity = parseInt(formData.get("quantity") as string);
    const selectedProduct = (products as any[]).find(
      (p: any) => p.id === productId,
    );

    if (!selectedProduct) return;

    const productionData = {
      productId,
      quantity,
      scheduledDate: new Date().toISOString().split("T")[0],
      status: "pending",
      priority: "medium",
    };

    createProductionMutation.mutate(productionData);
  };

  const expiredProducts = [
    {
      serialNo: 1,
      productName: "Chocolate Cake",
      quantity: 2,
      rate: 500,
      amount: 1000,
    },
    {
      serialNo: 2,
      productName: "Vanilla Cookies",
      quantity: 5,
      rate: 50,
      amount: 250,
    },
  ];

  const totalExpiredBalance = expiredProducts.reduce(
    (total, item) => total + item.amount,
    0,
  );

  return (
    <div className="p-6 space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Commonly used actions for quick access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-gray-50"
                onClick={action.action}
              >
                <div
                  className={`w-8 h-8 rounded-full ${action.color} flex items-center justify-center`}
                >
                  <action.icon className="w-4 h-4 text-white" />
                </div>
                <div className="text-center">
                  <div className="font-medium text-sm">{action.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {action.description}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rs. {(stats as any)?.todaySales?.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">
              +20.1% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats as any)?.todayOrders || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              +180.1% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Products In Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats as any)?.productsInStock || 0}
            </div>
            <p className="text-xs text-muted-foreground">+19% from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {(stats as any)?.lowStockItems || 0}
            </div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Production Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats as any)?.productionToday || 0}
            </div>
            <p className="text-xs text-muted-foreground">Items completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Production Schedule & Low Stock Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Production Schedule */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Production Schedule</CardTitle>
                <CardDescription>Today's production items</CardDescription>
              </div>
              <Dialog
                open={isProductionDialogOpen}
                onOpenChange={setIsProductionDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button size="sm" onClick={addProductionItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Production Item</DialogTitle>
                    <DialogDescription>
                      Schedule a new production item for today
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={saveProductionItem} className="space-y-4">
                    <Select name="productId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Product" />
                      </SelectTrigger>
                      <SelectContent>
                        {(products as any[]).map((product: any) => (
                          <SelectItem
                            key={product.id}
                            value={product.id.toString()}
                          >
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      name="quantity"
                      type="number"
                      placeholder="Quantity"
                      required
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsProductionDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createProductionMutation.isPending}
                      >
                        Add to Schedule
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serial No</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(todayProduction as any[]).map((item: any, index: number) => (
                  <TableRow key={item.id || index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      {item.productName || item.product?.name}
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>pcs</TableCell>
                    <TableCell>
                      Rs. {(item.quantity * (item.unitPrice || 0)).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                {(todayProduction as any[]).length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground"
                    >
                      No production scheduled for today
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <CardTitle>Low Stock Alert</CardTitle>
            </div>
            <CardDescription>Ingredients running low</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(lowStockItems as any[]).map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-red-800">{item.name}</p>
                    <p className="text-sm text-red-600">
                      Current: {item.currentStock} {item.unit}
                    </p>
                  </div>
                  <Badge variant="destructive">Low Stock</Badge>
                </div>
              ))}
              {(lowStockItems as any[]).length === 0 && (
                <div className="text-center text-muted-foreground">
                  All items are well stocked
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders & Expired Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest customer orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(recentOrders as any[]).map((order: any) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">Order #{order.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      Rs. {parseFloat(order.totalAmount).toFixed(2)}
                    </p>
                    <Badge
                      variant={
                        order.status === "completed" ? "default" : "secondary"
                      }
                    >
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {(recentOrders as any[]).length === 0 && (
                <div className="text-center text-muted-foreground">
                  No recent orders
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Expired Products Return */}
        <Card>
          <CardHeader>
            <CardTitle>Expired Products Return</CardTitle>
            <CardDescription>
              Products to be returned or disposed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serial No</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiredProducts.map((item) => (
                  <TableRow key={item.serialNo}>
                    <TableCell>{item.serialNo}</TableCell>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>Rs. {item.rate}</TableCell>
                    <TableCell>Rs. {item.amount}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-medium bg-gray-50">
                  <TableCell colSpan={4} className="text-right">
                    Total Balance:
                  </TableCell>
                  <TableCell>Rs. {totalExpiredBalance}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Admin Section */}
      {user?.role === "admin" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">Admin Panel</h2>
            <AdminUserManagement />
          </div>
        </div>
      )}
    </div>
  );
}