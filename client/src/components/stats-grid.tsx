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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((card, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{card.title}</p>
              <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              <p className={`text-sm ${card.changeColor}`}>{card.change}</p>
            </div>
            <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
              <i className={`${card.icon} ${card.iconColor}`}></i>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
