import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";

const navigation = [
  { name: "Dashboard", href: "/", icon: "fas fa-tachometer-alt" },
  { name: "Products", href: "/products", icon: "fas fa-box" },
  { name: "Orders", href: "/orders", icon: "fas fa-shopping-cart" },
  { name: "Inventory", href: "/inventory", icon: "fas fa-warehouse" },
  { name: "Production", href: "/production", icon: "fas fa-industry" },
  { name: "Assets", href: "/assets", icon: "fas fa-tools" },
  { name: "Expenses", href: "/expenses", icon: "fas fa-receipt" },
  { name: "Customers", href: "/customers", icon: "fas fa-users" },
  { name: "Parties", href: "/parties", icon: "fas fa-handshake" },
  { name: "Reports", href: "/reports", icon: "fas fa-chart-bar" },
];

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { logout } = useAuth();

  return (
    <div className="sidebar flex h-full w-60 flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <i className="fas fa-hotel text-white text-lg"></i>
          </div>
          <div>
            <div className="font-semibold text-white">BakeryPro</div>
            <div className="text-xs text-white/70">Management</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="sidebar-nav flex-1">
        <nav className="space-y-1 px-2">
          {navigation.map((item) => (
            <button
              key={item.name}
              onClick={() => onNavigate(item.href.slice(1) || "dashboard")}
              className={cn(
                "nav-item w-full",
                currentPage === (item.href.slice(1) || "dashboard") && "active"
              )}
            >
              <i className={item.icon}></i>
              {item.name}
            </button>
          ))}
        </nav>
      </ScrollArea>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center mb-3 px-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3">
            <i className="fas fa-user text-white text-sm"></i>
          </div>
          <div>
            <div className="text-sm font-medium text-white">Admin User</div>
            <div className="text-xs text-white/70">admin@bakery.com</div>
          </div>
        </div>
        <Button
          onClick={logout}
          variant="outline"
          size="sm"
          className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
        >
          <i className="fas fa-sign-out-alt mr-2"></i>
          Logout
        </Button>
      </div>
    </div>
  );
}