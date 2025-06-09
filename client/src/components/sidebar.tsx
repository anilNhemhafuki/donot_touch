import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/", icon: "fas fa-chart-pie" },
    { name: "Products", href: "/products", icon: "fas fa-cookie-bite" },
    { name: "Inventory", href: "/inventory", icon: "fas fa-boxes" },
    { name: "Orders", href: "/orders", icon: "fas fa-shopping-cart" },
    { name: "Production", href: "/production", icon: "fas fa-industry" },
    { name: "Reports", href: "/reports", icon: "fas fa-chart-bar" },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/";
    }
    return location.startsWith(href);
  };

  return (
    <aside className="w-64 bg-white shadow-lg flex-shrink-0 flex flex-col">
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <i className="fas fa-bread-slice text-white text-lg"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Sweet Treats</h1>
            <p className="text-sm text-gray-500">Bakery Management</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    active
                      ? "bg-primary text-white"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <i className={item.icon}></i>
                  <span className="font-medium">{item.name}</span>
                </a>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Profile */}
      <div className="mt-auto p-6 border-t">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
            <i className="fas fa-user text-primary text-sm"></i>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email || 'User'}
            </p>
            <p className="text-xs text-gray-500">{user?.role || 'Staff'}</p>
          </div>
          <button 
            onClick={() => window.location.href = '/api/logout'}
            className="text-gray-400 hover:text-gray-600"
          >
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>
    </aside>
  );
}
