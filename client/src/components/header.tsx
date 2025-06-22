import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  Globe,
  LogOut,
  User,
  Settings,
  Calendar,
  Bell,
} from "lucide-react";
import { Link } from "wouter";
import ProfileEditor from "./profile-editor";

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const getCurrentDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Searching for:", searchQuery);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      window.location.reload();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "supervisor":
        return "bg-blue-100 text-blue-800";
      case "manager":
        return "bg-green-100 text-green-800";
      case "marketer":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b dark:border-gray-700 px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-6 w-6" />
          </Button>

          {/* Logo for mobile */}
          <Link href="/" className="lg:hidden">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <i className="fas fa-bread-slice text-white text-sm"></i>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">
                Sweet Treats Bakery
              </span>
            </div>
          </Link>

          {/* Page title and date */}
          <div className="hidden lg:block">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  {getCurrentDate()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 lg:space-x-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="relative hidden md:block">
            <Input
              type="search"
              placeholder={t("search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-48 lg:w-64"
            />
            <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
          </form>

          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <Globe className="h-5 w-5" />
                <span className="hidden lg:inline ml-2">
                  {language === "en" ? "English" : "नेपाली"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLanguage("en")}>
                <span className="mr-2">🇺🇸</span> English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage("ne")}>
                <span className="mr-2">🇳🇵</span> नेपाली
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative p-2">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  3
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Notifications</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <DropdownMenuItem className="p-4 flex flex-col items-start">
                  <div className="flex items-center w-full">
                    <div className="h-2 w-2 bg-red-500 rounded-full mr-2"></div>
                    <span className="font-medium">Low Stock Alert</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      2 min ago
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Flour inventory is running low (5kg remaining)
                  </p>
                </DropdownMenuItem>
                <DropdownMenuItem className="p-4 flex flex-col items-start">
                  <div className="flex items-center w-full">
                    <div className="h-2 w-2 bg-blue-500 rounded-full mr-2"></div>
                    <span className="font-medium">New Order</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      1 hour ago
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Order #1234 received from John Doe
                  </p>
                </DropdownMenuItem>
                <DropdownMenuItem className="p-4 flex flex-col items-start">
                  <div className="flex items-center w-full">
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="font-medium">Production Complete</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      3 hours ago
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Chocolate cake batch completed successfully
                  </p>
                </DropdownMenuItem>
              </div>
              <div className="p-2 border-t">
                <Button variant="ghost" className="w-full text-sm">
                  View All Notifications
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Notifications</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <DropdownMenuItem className="p-4 flex flex-col items-start">
                  <div className="flex items-center w-full">
                    <div className="h-2 w-2 bg-red-500 rounded-full mr-2"></div>
                    <span className="font-medium">Low Stock Alert</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      2 min ago
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Flour inventory is running low
                  </p>
                </DropdownMenuItem>
                <DropdownMenuItem className="p-4 flex flex-col items-start">
                  <div className="flex items-center w-full">
                    <div className="h-2 w-2 bg-blue-500 rounded-full mr-2"></div>
                    <span className="font-medium">New Order</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      1 hour ago
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Order #1234 received
                  </p>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile */}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center space-x-3 p-2"
              >
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-primary rounded-full flex items-center justify-center">
                  {user?.profileImageUrl ? (
                    <img
                      src={user.profileImageUrl}
                      alt="Profile"
                      className="w-8 h-8 lg:w-10 lg:h-10 rounded-full object-cover"
                    />
                  ) : (
                    <i className="fas fa-user text-white text-sm"></i>
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2 border-b">
                <p className="text-sm font-medium">
                  {user?.firstName
                    ? `${user.firstName} ${user.lastName || ""}`.trim()
                    : user?.email || "User"}
                </p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <span
                  className={`inline-block text-xs px-2 py-1 rounded-full mt-1 ${getRoleColor(user?.role)}`}
                >
                  {t(user?.role || "staff")}
                </span>
              </div>
              <div className="p-2">
                <ProfileEditor user={user} />
              </div>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                {t("logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
