import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useSetup } from "@/hooks/useSetup";
import { usePermissions } from "@/hooks/usePermissions";
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
import Agents from "@/pages/agents";
import SalesBilling from "@/pages/sales-billing";
import BillEntry from "@/pages/bill-entry";
import SalesB2B from "@/pages/sales-b2b";
import SalesB2C from "@/pages/sales-b2c";
import SalesEstimate from "@/pages/sales-estimate";
import CreditNote from "@/pages/credit-note";
import DebitNote from "@/pages/debit-note";
import Sales from "@/pages/sales";
import Purchases from "@/pages/purchases";
import PurchaseEntry from "@/pages/purchase-entry";
import PurchaseDetail from "@/pages/purchase-detail";
import Payments from "@/pages/payments";
import Stock from "@/pages/stock";
import StockInward from "@/pages/stock-inward";
import BarcodeManagement from "@/pages/barcode-management";
import Outstanding from "@/pages/reports/outstanding";
import SalesReport from "@/pages/reports/sales-report";
import ItemsReport from "@/pages/reports/items-report";
import CategoriesReport from "@/pages/reports/categories-report";
import PurchaseReport from "@/pages/reports/purchase-report";
import Ledger from "@/pages/reports/ledger";
import PaymentsReport from "@/pages/reports/payments-report";
import Invoice from "@/pages/invoice";
import EditSale from "@/pages/edit-sale";
import UserManagement from "@/pages/user-management";
import BillSettings from "@/pages/bill-settings";
import Companies from "@/pages/companies";
import SelectCompany from "@/pages/select-company";
import BarcodeLookup from "@/pages/barcode-lookup";
import PurchaseDetails from "@/pages/purchase-details";

function ProtectedRoute({ path, component: Component }: { path: string; component: any }) {
  const { canAccess } = usePermissions();
  
  if (!canAccess(path)) {
    return null;
  }
  
  return <Route path={path} component={Component} />;
}

function Router() {
  const { isAuthenticated, user } = useAuth();
  const isSuperAdmin = (user as any)?.role === "admin" || (user as any)?.role === "superadmin";
  const { canAccess } = usePermissions();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/parties" component={Parties} />
      <ProtectedRoute path="/items" component={Items} />
      <ProtectedRoute path="/agents" component={Agents} />
      <ProtectedRoute path="/sales/b2b" component={SalesB2B} />
      <ProtectedRoute path="/sales/b2c" component={SalesB2C} />
      <ProtectedRoute path="/sales/estimate" component={SalesEstimate} />
      <ProtectedRoute path="/sales/credit-note" component={CreditNote} />
      <ProtectedRoute path="/sales/debit-note" component={DebitNote} />
      <ProtectedRoute path="/sales/new" component={SalesBilling} />
      <ProtectedRoute path="/bill-entry" component={BillEntry} />
      <ProtectedRoute path="/sales" component={Sales} />
      <ProtectedRoute path="/sales/edit/:id" component={EditSale} />
      <ProtectedRoute path="/invoice/:id" component={Invoice} />
      <ProtectedRoute path="/purchases/new" component={PurchaseEntry} />
      <ProtectedRoute path="/purchase-entry" component={PurchaseEntry} />
      <ProtectedRoute path="/stock-inward" component={StockInward} />
      <ProtectedRoute path="/barcode-management" component={BarcodeManagement} />
      <ProtectedRoute path="/barcode-lookup" component={BarcodeLookup} />
      <ProtectedRoute path="/purchases/:id" component={PurchaseDetails} />
      <ProtectedRoute path="/purchases" component={Purchases} />
      <ProtectedRoute path="/payments" component={Payments} />
      <ProtectedRoute path="/stock" component={Stock} />
      <ProtectedRoute path="/reports/outstanding" component={Outstanding} />
      <ProtectedRoute path="/reports/sales" component={SalesReport} />
      <ProtectedRoute path="/reports/purchases" component={PurchaseReport} />
      <ProtectedRoute path="/reports/items" component={ItemsReport} />
      <ProtectedRoute path="/reports/categories" component={CategoriesReport} />
      <ProtectedRoute path="/reports/payments" component={PaymentsReport} />
      <ProtectedRoute path="/reports/ledger/:id" component={Ledger} />
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
  const { currentCompany, isLoading: companyLoading, needsCompanySelection } = useCompany();

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  const isSuperAdmin = (user as any)?.role === "admin" || (user as any)?.role === "superadmin";

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

  // Show company selection page if user has multiple companies and hasn't selected one yet
  if (needsCompanySelection) {
    return <SelectCompany />;
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
