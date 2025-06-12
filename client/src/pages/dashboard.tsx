import EnhancedDashboard from "@/components/enhanced-dashboard";

export default function Dashboard() {
  return (
    <div className="dashboard-layout">
      <div className="main-content">
        <div className="dashboard-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">Dashboard</h1>
              <p className="page-subtitle">Super Admin - All Branches Overview</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">
                Today: {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <Button
                onClick={() => setShowOrderForm(true)}
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Order
              </Button>
            </div>
          </div>
        </div>
<StatsGrid />

      {/* Branch Performance Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Branch Performance</h2>
          <span className="text-sm text-muted-foreground">Real-time performance metrics across all bakery branches</span>
        </div>

        <div className="performance-grid">
          <div className="performance-card">
            <div className="performance-card-header">
              <div className="performance-card-title">Main Branch</div>
              <div className="performance-card-id">ID: 1</div>
            </div>
            <div className="text-sm text-muted-foreground mb-2">Occupancy Rate: 0%</div>
            <div className="performance-metrics">
              <div className="metric-item">
                <div className="metric-label">Reservations</div>
                <div className="metric-value">1</div>
              </div>
              <div className="metric-item">
                <div className="metric-label">Available</div>
                <div className="metric-value">1</div>
              </div>
              <div className="metric-item">
                <div className="metric-label">Today's Revenue</div>
                <div className="metric-value">Rs. 3,000</div>
              </div>
            </div>
          </div>

          <div className="performance-card">
            <div className="performance-card-header">
              <div className="performance-card-title">Downtown</div>
              <div className="performance-card-id">ID: 2</div>
            </div>
            <div className="text-sm text-muted-foreground mb-2">Occupancy Rate: 0%</div>
            <div className="performance-metrics">
              <div className="metric-item">
                <div className="metric-label">Reservations</div>
                <div className="metric-value">1</div>
              </div>
              <div className="metric-item">
                <div className="metric-label">Available</div>
                <div className="metric-value">1</div>
              </div>
              <div className="metric-item">
                <div className="metric-label">Today's Revenue</div>
                <div className="metric-value">Rs. 4,500</div>
              </div>
            </div>
          </div>

          <div className="performance-card">
            <div className="performance-card-header">
              <div className="performance-card-title">Mall Location</div>
              <div className="performance-card-id">ID: 3</div>
            </div>
            <div className="text-sm text-muted-foreground mb-2">Occupancy Rate: 0%</div>
            <div className="performance-metrics">
              <div className="metric-item">
                <div className="metric-label">Reservations</div>
                <div className="metric-value">2</div>
              </div>
              <div className="metric-item">
                <div className="metric-label">Available</div>
                <div className="metric-value">1</div>
              </div>
              <div className="metric-item">
                <div className="metric-label">Today's Revenue</div>
                <div className="metric-value">Rs. 18,000</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="data-table">
          <div className="table-header">
            <div className="table-title flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Orders
            </div>
          </div>
          <CardContent>
            <RecentOrdersList />
          </CardContent>
        </Card>
</div>
    </div>
  );
}