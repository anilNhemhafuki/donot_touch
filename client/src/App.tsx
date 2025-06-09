import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Products from "@/pages/products";
import Inventory from "@/pages/inventory";
import Orders from "@/pages/orders";
import Production from "@/pages/production";
import Reports from "@/pages/reports";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading || !isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <Header />
        <div className="flex-1 overflow-x-hidden">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/products" component={Products} />
            <Route path="/inventory" component={Inventory} />
            <Route path="/orders" component={Orders} />
            <Route path="/production" component={Production} />
            <Route path="/reports" component={Reports} />
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
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
