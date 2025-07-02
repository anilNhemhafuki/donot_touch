import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useState } from "react";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Products from "@/pages/products";
import Inventory from "@/pages/inventory";
import Orders from "@/pages/orders";
import Production from "@/pages/production";
import Assets from "@/pages/assets";
import Expenses from "@/pages/expenses";
import Parties from "@/pages/parties";
import Reports from "@/pages/reports";
import DayBook from "./pages/day-book";
import Transactions from "@/pages/transactions";
import Billing from "@/pages/billing";
import Settings from "@/pages/settings";
import Notifications from "./pages/notifications";
import AdminUsers from "@/pages/admin-users";
import NotFound from "@/pages/not-found";
import LoginForm from "@/components/login-form";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import Customers from "@/pages/customers";
import NotificationSettings from "@/components/notification-settings";
import CategoryManagement from "@/pages/category-management";
import Sales from "@/pages/sales";
import Purchases from "@/pages/purchases";
import PublicOrderForm from "@/components/public-order-form";
import Stock from "@/pages/stock";
import Units from "@/pages/units";
import CompanySettings from "@/pages/company-settings";

function Router() {
  const { user, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Public routes (no authentication required)
  return (
    <Switch>
      <Route path="/order" component={PublicOrderForm} />
      <Route path="*">
        {!user ? (
          <LoginForm
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
            }}
          />
        ) : (
          <AuthenticatedApp sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        )}
      </Route>
    </Switch>
  );
}

function AuthenticatedApp({ sidebarOpen, setSidebarOpen }: { sidebarOpen: boolean; setSidebarOpen: (open: boolean) => void }) {
  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <main className="flex-1 flex flex-col lg:ml-0">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex-1 overflow-x-hidden">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/products" component={Products} />
            <Route path="/inventory" component={Inventory} />
            <Route path="/stock" component={Stock} />
            <Route path="/orders" component={Orders} />
            <Route path="/production" component={Production} />
            <Route path="/customers" component={Customers} />
            <Route path="/parties" component={Parties} />
            <Route path="/assets" component={Assets} />
            <Route path="/expenses" component={Expenses} />
            <Route path="/reports" component={Reports} />
            <Route path="/day-book" component={DayBook} />
            <Route path="/transactions" component={Transactions} />
            <Route path="/billing" component={Billing} />
            <Route path="/settings" component={Settings} />
            <Route path="/company-settings" component={CompanySettings} />
            <Route path="/notifications" component={Notifications} />
            <Route path="/categories" component={CategoryManagement} />
            <Route path="/units" component={Units} />
            <Route path="/sales" component={Sales} />
            <Route path="/purchases" component={Purchases} />
            <Route path="/admin/users" component={AdminUsers} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;