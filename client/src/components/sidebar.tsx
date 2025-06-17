import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import { Receipt } from "lucide-react";
import { Settings } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ isOpen = true, onToggle }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [openSections, setOpenSections] = useState<string[]>([
    "core",
    "transactions",
  ]);

  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section],
    );
  };

  const navigationSections = [
    {
      id: "core",
      title: "Core Operations",
      items: [
        { name: "Dashboard", href: "/", icon: "fas fa-chart-pie" },
        { name: "Products", href: "/products", icon: "fas fa-cookie-bite" },
        { name: "Inventory", href: "/inventory", icon: "fas fa-boxes" },
        { name: "Orders", href: "/orders", icon: "fas fa-shopping-cart" },
        { name: "Production", href: "/production", icon: "fas fa-industry" },
      ],
    },
    {
      id: "transactions",
      title: "Transactions",
      items: [
        { name: "Sales", href: "/sales", icon: "fas fa-cash-register" },
        { name: "Purchases", href: "/purchases", icon: "fas fa-shopping-bag" },
      ],
    },
    {
      id: "management",
      title: "Management",
      items: [
        { name: "Customers", href: "/customers", icon: "fas fa-users" },
        { name: "Parties", href: "/parties", icon: "fas fa-handshake" },
        { name: "Assets", href: "/assets", icon: "fas fa-building" },
        { name: "Expenses", href: "/expenses", icon: "fas fa-receipt" },
      ],
    },
    {
      id: "reports",
      title: "Reports & Analytics",
      items: [
        { name: "Reports", href: "/reports", icon: "fas fa-chart-bar" },
        {
          name: "Billing",
          href: "/billing",
          icon: "fas fa-file-invoice-dollar",
        },
      ],
    },
    {
      id: "settings",
      title: "Settings",
      items: [
        { name: "Settings", href: "/settings", icon: "fas fa-cog" },
        { name: "Notifications", href: "/notifications", icon: "fas fa-bell" },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/";
    }
    return location.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`
        fixed lg:static inset-y-0 left-0 z-50 
        w-64 bg-white dark:bg-gray-900 shadow-lg 
        flex-shrink-0 flex flex-col transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        
      `}
      >
        {/* Mobile close button */}
        <div className="lg:hidden flex justify-end p-4 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={onToggle}>
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Logo */}
        <div className="p-6 flex-shrink-0">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <i className="fas fa-bread-slice text-white text-lg"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Sweet Treats
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Bakery Management
              </p>
            </div>
          </Link>
        </div>

        {/* Scrollable Navigation */}
        <div className="h-full flex-1 overflow-y-auto px-6 pb-6">
          <nav className="space-y-1">
            {navigationSections.map((section) => (
              <div key={section.id} className="mb-4">
                <Collapsible
                  open={openSections.includes(section.id)}
                  onOpenChange={() => toggleSection(section.id)}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md">
                    <span>{section.title}</span>
                    {openSections.includes(section.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-1 space-y-1">
                    {section.items.map((item) => {
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`flex items-center space-x-3 px-4 py-2 ml-2 rounded-lg transition-colors text-sm ${
                            active
                              ? "bg-primary text-white"
                              : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                          }`}
                        >
                          <i className={item.icon}></i>
                          <span className="font-medium">{item.name}</span>
                        </Link>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ))}

            {/* Admin-only section */}
            {(user?.role === "admin" ||
              user?.role === "supervisor" ||
              user?.role === "manager") && (
              <div className="mb-4">
                <Collapsible
                  open={openSections.includes("admin")}
                  onOpenChange={() => toggleSection("admin")}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md">
                    <span>Administration</span>
                    {openSections.includes("admin") ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-1 space-y-1">
                    {user?.role === "admin" && (
                      <Link
                        href="/admin/users"
                        className={`flex items-center space-x-3 px-4 py-2 ml-2 rounded-lg transition-colors text-sm ${
                          isActive("/admin/users")
                            ? "bg-primary text-white"
                            : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                        }`}
                      >
                        <i className="fas fa-users-cog"></i>
                        <span className="font-medium">User Management</span>
                      </Link>
                    )}
                    <Link
                      href="/categories"
                      className={`flex items-center space-x-3 px-4 py-2 ml-2 rounded-lg transition-colors text-sm ${
                        isActive("/categories")
                          ? "bg-primary text-white"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      <i className="fas fa-tags"></i>
                      <span className="font-medium">Category Management</span>
                    </Link>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}
          </nav>
        </div>

        {/* User Profile */}
        <div className="flex-shrink-0 p-6 border-t dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
              <i className="fas fa-user text-primary text-sm"></i>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.firstName
                  ? `${user.firstName} ${user.lastName || ""}`.trim()
                  : user?.email || "User"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.role || "Staff"}
              </p>
            </div>
            <button
              onClick={async () => {
                try {
                  await fetch("/api/logout", {
                    method: "POST",
                    credentials: "include",
                  });
                  window.location.reload();
                } catch (error) {
                  console.error("Logout failed:", error);
                }
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
