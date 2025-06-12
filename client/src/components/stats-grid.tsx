interface StatsGridProps {
  stats?: {
    todaySales: number;
    todayOrders: number;
    productsInStock: number;
    lowStockItems: number;
    productionToday: number;
  };
}

export default function StatsGrid({ stats }: StatsGridProps) {
  const statCards = [
    {
      title: "Today's Sales",
      value: `$${(stats?.todaySales || 0).toFixed(2)}`,
      change: "+12% from yesterday",
      icon: "fas fa-dollar-sign",
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
      changeColor: "text-green-600"
    },
    {
      title: "Orders Today",
      value: stats?.todayOrders?.toString() || "0",
      change: "+8% from yesterday",
      icon: "fas fa-shopping-bag",
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
      changeColor: "text-green-600"
    },
    {
      title: "Products in Stock",
      value: stats?.productsInStock?.toString() || "0",
      change: `${stats?.lowStockItems || 0} items low stock`,
      icon: "fas fa-boxes",
      bgColor: "bg-orange-100",
      iconColor: "text-orange-600",
      changeColor: stats?.lowStockItems ? "text-orange-600" : "text-green-600"
    },
    {
      title: "Production Today",
      value: stats?.productionToday?.toString() || "0",
      change: "items completed",
      icon: "fas fa-industry",
      bgColor: "bg-primary/20",
      iconColor: "text-primary",
      changeColor: "text-green-600"
    }
  ];

  return (
    <div className="stats-grid">
      {statCards.map((card, index) => (
        <div key={index} className="stat-card">
          <div className="flex items-start justify-between mb-3">
            <div className="stat-card-title">{card.title}</div>
            <div className="stat-card-icon">
              <i className={card.icon}></i>
            </div>
          </div>
          <div className="stat-card-value">{card.value}</div>
          <div className={`stat-card-change ${card.change?.includes('+') ? 'positive' : card.change?.includes('-') ? 'negative' : ''}`}>
            {card.change}
          </div>
        </div>
      ))}
    </div>
  );
}
