import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useCompanyBranding } from "@/hooks/use-company-branding";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const { branding } = useCompanyBranding();
  const [openSections, setOpenSections] = useState<string[]>([
    "core",
    "Finance",
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
      items: [
        { name: "Dashboard", href: "/" },
        { name: "Settings", href: "/settings" },
        { name: "Company Settings", href: "/company-settings" },
        { name: "Notifications", href: "/notifications" },
      ],
    },
    {
      id: "Stock",
      title: "Stock",
      items: [
        { name: "Products", href: "/products", icon: "fas fa-cookie-bite" },
        { name: "Stock", href: "/stock", icon: "fas fa-boxes" },
        { name: "Production", href: "/production", icon: "fas fa-industry" },
      ],
    },

    {
      id: "Finance",
      title: "Finance",
      items: [
        { name: "Day Book", href: "/day-book", icon: "fas fa-shopping-cart" },
        {
          name: "Transactions",
          href: "/transactions",
          icon: "fas fa-exchange-alt",
        },
        { name: "Orders", href: "/orders", icon: "fas fa-shopping-cart" },
        { name: "Sales", href: "/sales", icon: "fas fa-cash-register" },
        { name: "Purchases", href: "/purchases", icon: "fas fa-shopping-bag" },
        {
          name: "Income & Expenses",
          href: "/expenses",
          icon: "fas fa-receipt",
        },
      ],
    },
    {
      id: "management",
      title: "Management",
      items: [
        { name: "Customers", href: "/customers", icon: "fas fa-users" },
        { name: "Parties", href: "/parties", icon: "fas fa-handshake" },
        { name: "Assets", href: "/assets", icon: "fas fa-building" },
      ],
    },
    {
      id: "reports",
      title: "Reports & Analytics",
      items: [
        { name: "Reports", href: "/reports", icon: "fas fa-chart-bar" },
        {
          name: "Billing & Subscription",
          href: "/billing",
          icon: "fas fa-file-invoice-dollar",
        },
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
        w-64 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 shadow-xl border-r border-gray-200 dark:border-gray-700
        flex-shrink-0 flex flex-col transform transition-all duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}

      `}
      >
        {/* Mobile close button */}
        <div className="lg:hidden flex justify-end p-4 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={onToggle}>
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Dynamic Company Header */}
        <div
          className="p-2 flex-shrink-0 bg-gradient-to-r from-primary/80 to-primary text-white"
          style={{
            backgroundImage: `linear-gradient(135deg, ${branding.themeColor}CC, ${branding.themeColor})`,
          }}
        >
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
              {branding.companyLogo ? (
                <img
                  src={branding.companyLogo}
                  alt="Company Logo"
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <i className="fas fa-bread-slice text-white text-xl"></i>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold">{branding.companyName}</h1>
            </div>
          </Link>
        </div>

        {/* Scrollable Navigation */}
        <ScrollArea className="h-full px-2 lg:px-3">
          <div className=" h-full flex-1 overflow-y-auto px-6 pb-6">
            <nav className="space-y-1">
              {/* Render top-level items directly without Collapsible */}
              {navigationSections
                .filter(
                  (section) => section.id === "core", // Add other top-level sections here if needed
                )
                .flatMap((section) =>
                  section.items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                          active
                            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105"
                            : "text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-700 dark:hover:to-gray-600 hover:text-gray-900 dark:hover:text-white hover:shadow-md"
                        } mx-2`}
                      >
                        <i className={item.icon}></i>
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    );
                  }),
                )}

              {/* Render remaining grouped sections inside Collapsible */}
              {navigationSections
                .filter((section) => section.id !== "core")
                .map((section) => (
                  <div key={section.id} className="mb-4">
                    <Collapsible
                      open={openSections.includes(section.id)}
                      onOpenChange={() => toggleSection(section.id)}
                    >
                      <CollapsibleTrigger className="flex items-center w-full px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-700 dark:hover:to-gray-600 rounded-xl transition-all duration-200 mx-2">
                        {/* Title */}
                        <span>{section.title}</span>
                        {/* Arrow Icon */}
                        <div className="ml-auto">
                          {openSections.includes(section.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-1 space-y-1 border-l-4 border-transparent">
                        {section.items.map((item) => {
                          const active = isActive(item.href);
                          return (
                            <Link
                              key={item.name}
                              href={item.href}
                              className={`font-normal flex items-center space-x-3 px-4 py-2 ml-4 rounded-lg transition-all duration-200 text-sm ${
                                active
                                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md transform scale-105"
                                  : "text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-700 dark:hover:to-gray-600 hover:text-gray-900 dark:hover:text-white hover:shadow-sm"
                              }`}
                            >
                              {/* Icon */}
                              <i className={item.icon}></i>
                              {/* Name */}
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
                      <Link
                        href="/units"
                        className={`flex items-center space-x-3 px-4 py-2 ml-2 rounded-lg transition-colors text-sm ${
                          isActive("/units")
                            ? "bg-primary text-white"
                            : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                        }`}
                      >
                        <i className="fas fa-ruler"></i>
                        <span className="font-medium">Measuring Units</span>
                      </Link>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              )}
            </nav>
          </div>
        </ScrollArea>
        {/* Enhanced User Profile */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700">
          <div className="flex items-center space-x-3 bg-white dark:bg-gray-800 rounded-xl p-3 shadow-md border border-gray-200 dark:border-gray-600">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <i className="fas fa-user text-white"></i>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {user?.firstName
                  ? `${user.firstName} ${user.lastName || ""}`.trim()
                  : user?.email || "User"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                <i className="fas fa-badge-check mr-1"></i>
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
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
              title="Logout"
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
