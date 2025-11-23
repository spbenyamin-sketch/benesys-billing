import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Parties from "@/pages/parties";
import Items from "@/pages/items";
import SalesBilling from "@/pages/sales-billing";
import Sales from "@/pages/sales";
import Purchases from "@/pages/purchases";
import Payments from "@/pages/payments";
import Stock from "@/pages/stock";
import Outstanding from "@/pages/reports/outstanding";
import SalesReport from "@/pages/reports/sales-report";
import ItemsReport from "@/pages/reports/items-report";
import Ledger from "@/pages/reports/ledger";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/parties" component={Parties} />
          <Route path="/items" component={Items} />
          <Route path="/sales/new" component={SalesBilling} />
          <Route path="/sales" component={Sales} />
          <Route path="/purchases" component={Purchases} />
          <Route path="/payments" component={Payments} />
          <Route path="/stock" component={Stock} />
          <Route path="/reports/outstanding" component={Outstanding} />
          <Route path="/reports/sales" component={SalesReport} />
          <Route path="/reports/items" component={ItemsReport} />
          <Route path="/reports/ledger/:id" component={Ledger} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  if (isLoading || !isAuthenticated) {
    return <Router />;
  }

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between border-b px-4 py-3">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </header>
          <main className="flex-1 overflow-y-auto">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
