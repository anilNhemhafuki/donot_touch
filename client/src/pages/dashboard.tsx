import { useQuery } from "@tanstack/react-query";
import StatsGrid from "@/components/stats-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Dashboard() {
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentOrders, isLoading: ordersLoading, error: ordersError } = useQuery({
    queryKey: ["/api/dashboard/recent-orders"],
  });

  const { data: productionSchedule, isLoading: productionLoading, error: productionError } = useQuery({
    queryKey: ["/api/dashboard/production-schedule"],
  });

  const { data: lowStockItems, isLoading: lowStockLoading, error: lowStockError } = useQuery({
    queryKey: ["/api/dashboard/low-stock"],
  });

  useEffect(() => {
    const errors = [statsError, ordersError, productionError, lowStockError].filter(Boolean);
    errors.forEach(error => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    });
  }, [statsError, ordersError, productionError, lowStockError, toast]);

  if (statsLoading || ordersLoading || productionLoading || lowStockLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-gray-200 rounded-lg"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      in_progress: "secondary",
      pending: "outline",
      cancelled: "destructive"
    };
    
    const labels: Record<string, string> = {
      completed: "Completed",
      in_progress: "In Progress", 
      pending: "Pending",
      cancelled: "Cancelled"
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-8">
      {/* Stats Grid */}
      <StatsGrid stats={stats} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders && recentOrders.length > 0 ? (
                  recentOrders.map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                          <i className="fas fa-shopping-bag text-primary"></i>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{order.customerName}</p>
                          <p className="text-sm text-gray-500">Order #{order.orderNumber}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(order.orderDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ${Number(order.totalAmount).toFixed(2)}
                        </p>
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <i className="fas fa-shopping-cart text-4xl mb-4 opacity-50"></i>
                    <p>No recent orders found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Low Stock */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full justify-start" variant="default">
                  <i className="fas fa-plus mr-2"></i>
                  Add New Product
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <i className="fas fa-shopping-cart mr-2"></i>
                  Create Order
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <i className="fas fa-clipboard-list mr-2"></i>
                  Update Inventory
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <i className="fas fa-chart-line mr-2"></i>
                  View Reports
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-orange-600">
                Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStockItems && lowStockItems.length > 0 ? (
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
                  <div className="text-center py-4 text-gray-500">
                    <i className="fas fa-check-circle text-2xl mb-2 text-green-500"></i>
                    <p className="text-sm">All items are well stocked</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Production Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Today's Production Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {productionSchedule && productionSchedule.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Product</th>
                    <th className="text-left py-2">Quantity</th>
                    <th className="text-left py-2">Start Time</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Assigned To</th>
                  </tr>
                </thead>
                <tbody>
                  {productionSchedule.map((item: any) => (
                    <tr key={item.id} className="border-b">
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
                        {item.startTime ? new Date(item.startTime).toLocaleTimeString() : 'Not started'}
                      </td>
                      <td className="py-3">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="py-3">{item.assignedUserName || 'Unassigned'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-calendar-alt text-4xl mb-4 opacity-50"></i>
              <p>No production scheduled for today</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
