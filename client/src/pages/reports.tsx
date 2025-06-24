import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useCurrency } from "@/hooks/useCurrency";

export default function Reports() {
  const [timeRange, setTimeRange] = useState("30");
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(timeRange));

  const {
    data: analytics,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "/api/analytics/sales",
      { startDate: startDate.toISOString(), endDate: new Date().toISOString() },
    ],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

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

  const exportReport = () => {
    toast({
      title: "Export Started",
      description: "Your report is being generated and will download shortly.",
    });
    // In a real implementation, this would trigger a download
  };

  const getTimeRangeLabel = (days: string) => {
    switch (days) {
      case "7":
        return "Last 7 Days";
      case "30":
        return "Last 30 Days";
      case "90":
        return "Last 3 Months";
      case "365":
        return "Last Year";
      default:
        return "Last 30 Days";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
            Sales & Analytics Reports
          </h1>
          <p className="text-gray-600">
            Analyze your bakery's performance and trends
          </p>
        </div>
        <div className="flex space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 3 Months</SelectItem>
              <SelectItem value="365">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} variant="outline">
            <i className="fas fa-download mr-2"></i>
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Revenue
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  $
                  {analytics?.salesData
                    ?.reduce((sum: number, day: any) => sum + day.sales, 0)
                    ?.toFixed(2) || "0.00"}
                </p>
                <p className="text-sm text-green-600">
                  {getTimeRangeLabel(timeRange)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-dollar-sign text-green-600"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Orders
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {analytics?.salesData?.reduce(
                    (sum: number, day: any) => sum + day.orders,
                    0,
                  ) || 0}
                </p>
                <p className="text-sm text-blue-600">
                  {getTimeRangeLabel(timeRange)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-shopping-cart text-blue-600"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Average Order
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  $
                  {analytics?.salesData?.length > 0
                    ? (
                        analytics.salesData.reduce(
                          (sum: number, day: any) => sum + day.sales,
                          0,
                        ) /
                        analytics.salesData.reduce(
                          (sum: number, day: any) => sum + day.orders,
                          0,
                        )
                      ).toFixed(2)
                    : "0.00"}
                </p>
                <p className="text-sm text-purple-600">Per order value</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-chart-line text-purple-600"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Products in Stock
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.productsInStock || 0}
                </p>
                <p className="text-sm text-orange-600">
                  {stats?.lowStockItems || 0} low stock
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-boxes text-orange-600"></i>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.salesData?.length > 0 ? (
              <div className="space-y-4">
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <i className="fas fa-chart-line text-4xl mb-2"></i>
                    <p>Sales Chart Visualization</p>
                    <p className="text-sm">
                      Would integrate Chart.js or similar
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">
                      $
                      {analytics.salesData
                        .reduce((sum: number, day: any) => sum + day.sales, 0)
                        .toFixed(2)}
                    </div>
                    <div className="text-gray-500">Total Sales</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">
                      {analytics.salesData.reduce(
                        (sum: number, day: any) => sum + day.orders,
                        0,
                      )}
                    </div>
                    <div className="text-gray-500">Total Orders</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">
                      {analytics.salesData.length}
                    </div>
                    <div className="text-gray-500">Days of Data</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <i className="fas fa-chart-line text-4xl mb-4 opacity-50"></i>
                  <p>No sales data available for selected period</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.topProducts?.length > 0 ? (
              <div className="space-y-4">
                {analytics.topProducts
                  .slice(0, 10)
                  .map((product: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                          <span className="text-primary font-semibold text-sm">
                            #{index + 1}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.quantity} units sold
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          ${Number(product.revenue).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">Revenue</div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <i className="fas fa-cookie-bite text-4xl mb-4 opacity-50"></i>
                  <p>No product data available for selected period</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.topProducts
                ?.slice(0, 5)
                .map((product: any, index: number) => {
                  const total = analytics.topProducts.reduce(
                    (sum: number, p: any) => sum + p.revenue,
                    0,
                  );
                  const percentage =
                    total > 0
                      ? ((product.revenue / total) * 100).toFixed(1)
                      : 0;

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-600">
                        {product.name}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">
                          {formatCurrency(Number(product.revenue))}
                        </span>
                        <Badge variant="outline">{percentage}%</Badge>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">
                    Average Order Value
                  </span>
                  <span className="font-semibold">
                    $
                    {analytics?.salesData?.length > 0
                      ? (
                          analytics.salesData.reduce(
                            (sum: number, day: any) => sum + day.sales,
                            0,
                          ) /
                          analytics.salesData.reduce(
                            (sum: number, day: any) => sum + day.orders,
                            0,
                          )
                        ).toFixed(2)
                      : "0.00"}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: "75%" }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">
                    Daily Order Target
                  </span>
                  <span className="font-semibold">
                    {Math.round(
                      (analytics?.salesData?.reduce(
                        (sum: number, day: any) => sum + day.orders,
                        0,
                      ) || 0) / Math.max(analytics?.salesData?.length || 1, 1),
                    )}{" "}
                    / 50
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(100, (Math.round((analytics?.salesData?.reduce((sum: number, day: any) => sum + day.orders, 0) || 0) / Math.max(analytics?.salesData?.length || 1, 1)) / 50) * 100)}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Stock Health</span>
                  <span className="font-semibold">
                    {stats?.productsInStock
                      ? Math.max(
                          0,
                          100 -
                            (stats.lowStockItems / stats.productsInStock) * 100,
                        ).toFixed(0)
                      : 100}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{
                      width: `${stats?.productsInStock ? Math.max(0, 100 - (stats.lowStockItems / stats.productsInStock) * 100) : 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-green-800">Best Sales Day</p>
                  <p className="text-sm text-green-600">
                    {analytics?.salesData?.length > 0
                      ? new Date(
                          analytics.salesData.reduce((best: any, day: any) =>
                            day.sales > best.sales ? day : best,
                          ).date,
                        ).toLocaleDateString()
                      : "No data"}
                  </p>
                </div>
                <i className="fas fa-trophy text-green-600"></i>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-blue-800">Most Popular Item</p>
                  <p className="text-sm text-blue-600">
                    {analytics?.topProducts?.[0]?.name || "No data"}
                  </p>
                </div>
                <i className="fas fa-star text-blue-600"></i>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div>
                  <p className="font-medium text-purple-800">Active Period</p>
                  <p className="text-sm text-purple-600">
                    {getTimeRangeLabel(timeRange)}
                  </p>
                </div>
                <i className="fas fa-calendar text-purple-600"></i>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
