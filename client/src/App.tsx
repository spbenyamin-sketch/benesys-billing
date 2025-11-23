import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useSetup } from "@/hooks/useSetup";
import { CompanyProvider, useCompany } from "@/contexts/CompanyContext";
import { CompanySelector } from "@/components/CompanySelector";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Setup from "@/pages/setup";
import { Building2 } from "lucide-react";
import Dashboard from "@/pages/dashboard";
import Parties from "@/pages/parties";
import Items from "@/pages/items";
import SalesBilling from "@/pages/sales-billing";
import Sales from "@/pages/sales";
import Purchases from "@/pages/purchases";
import PurchaseEntry from "@/pages/purchase-entry";
import PurchaseDetail from "@/pages/purchase-detail";
import Payments from "@/pages/payments";
import Stock from "@/pages/stock";
import StockView from "@/pages/stock-view";
import Outstanding from "@/pages/reports/outstanding";
import SalesReport from "@/pages/reports/sales-report";
import ItemsReport from "@/pages/reports/items-report";
import PurchaseReport from "@/pages/reports/purchase-report";
import Ledger from "@/pages/reports/ledger";
import UserManagement from "@/pages/user-management";
import BillSettings from "@/pages/bill-settings";
import Companies from "@/pages/companies";

function Router() {
  const { isAuthenticated, user } = useAuth();
  const isSuperAdmin = user?.role === "admin";

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/parties" component={Parties} />
      <Route path="/items" component={Items} />
      <Route path="/sales/new" component={SalesBilling} />
      <Route path="/sales" component={Sales} />
      <Route path="/purchases/new" component={PurchaseEntry} />
      <Route path="/purchases/:id" component={PurchaseDetail} />
      <Route path="/purchases" component={Purchases} />
      <Route path="/payments" component={Payments} />
      <Route path="/stock/view" component={StockView} />
      <Route path="/stock" component={Stock} />
      <Route path="/reports/outstanding" component={Outstanding} />
      <Route path="/reports/sales" component={SalesReport} />
      <Route path="/reports/purchases" component={PurchaseReport} />
      <Route path="/reports/items" component={ItemsReport} />
      <Route path="/reports/ledger/:id" component={Ledger} />
      {isSuperAdmin && <Route path="/users" component={UserManagement} />}
      {isSuperAdmin && <Route path="/companies" component={Companies} />}
      {isSuperAdmin && <Route path="/bill-settings" component={BillSettings} />}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { needsSetup, isLoading: setupLoading } = useSetup();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { currentCompany, isLoading: companyLoading } = useCompany();

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  const isSuperAdmin = user?.role === "admin";

  // Show loading state
  if (setupLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  // Show setup page if needed
  if (needsSetup) {
    return <Setup />;
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  // Show company selector if no company selected (unless super admin accessing admin-only pages)
  if (companyLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg">Loading companies...</div>
        </div>
      </div>
    );
  }
  
  // If no company selected and not loading, check if we should show selector or admin interface
  if (!currentCompany) {
    // Super admins can access admin pages without a company selected
    if (isSuperAdmin) {
      return (
        <SidebarProvider style={sidebarStyle}>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <header className="flex items-center justify-between border-b px-4 py-3">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <div className="text-sm text-muted-foreground">
                  No company selected - Create a company to get started
                </div>
              </header>
              <main className="flex-1 overflow-y-auto">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
      );
    }
    // Regular users must select a company
    return <CompanySelector />;
  }

  // Show main app with sidebar
  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between border-b px-4 py-3">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium" data-testid="text-company-name">
                  {currentCompany.name}
                </span>
              </div>
              <CompanySwitcher />
            </div>
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
        <CompanyProvider>
          <AppContent />
          <Toaster />
        </CompanyProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
