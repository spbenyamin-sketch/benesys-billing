import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  ShoppingCart,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  Shield,
  Building2,
  UserCircle,
  Briefcase,
  Store,
  FileEdit,
  CreditCard,
  PackagePlus,
  Barcode,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/contexts/CompanyContext";
import { useTranslation } from "react-i18next";

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { resetCompanySelection } = useCompany();
  const { t } = useTranslation();
  const isSuperAdmin = user?.role === "admin" || user?.role === "superadmin";

  const salesMenuItems = [
    {
      title: t('nav.salesB2B'),
      url: "/sales/b2b",
      icon: Briefcase,
    },
    {
      title: t('nav.salesB2C'),
      url: "/sales/b2c",
      icon: Store,
    },
    {
      title: t('nav.estimate'),
      url: "/sales/estimate",
      icon: FileEdit,
    },
    {
      title: t('nav.creditNote'),
      url: "/sales/credit-note",
      icon: CreditCard,
    },
    {
      title: t('nav.debitNote'),
      url: "/sales/debit-note",
      icon: CreditCard,
    },
    {
      title: t('sales.salesList'),
      url: "/sales",
      icon: ShoppingCart,
    },
  ];

  const mastersMenuItems = [
    {
      title: t('nav.customers'),
      url: "/parties",
      icon: Users,
    },
    {
      title: t('nav.items'),
      url: "/items",
      icon: Package,
    },
    {
      title: t('nav.agents'),
      url: "/agents",
      icon: UserCircle,
    },
  ];

  const transactionsMenuItems = [
    {
      title: t('nav.purchaseEntry'),
      url: "/purchase-entry",
      icon: FileText,
    },
    {
      title: t('nav.stockInward'),
      url: "/stock-inward",
      icon: PackagePlus,
    },
    {
      title: t('nav.barcodeManagement'),
      url: "/barcode-management",
      icon: Barcode,
    },
    {
      title: t('nav.barcodeLookup'),
      url: "/barcode-lookup",
      icon: Barcode,
    },
    {
      title: t('nav.payments'),
      url: "/payments",
      icon: Wallet,
    },
  ];

  const reportsMenuItems = [
    {
      title: t('nav.outstandingReport'),
      url: "/reports/outstanding",
      icon: BarChart3,
    },
    {
      title: t('nav.salesReport'),
      url: "/reports/sales",
      icon: FileText,
    },
    {
      title: t('nav.purchaseReport'),
      url: "/reports/purchases",
      icon: ShoppingCart,
    },
    {
      title: t('reports.itemWiseSales'),
      url: "/reports/items",
      icon: Package,
    },
    {
      title: t('reports.categoryWiseSales'),
      url: "/reports/categories",
      icon: BarChart3,
    },
    {
      title: t('reports.paymentReport'),
      url: "/reports/payments",
      icon: Wallet,
    },
    {
      title: t('nav.stock'),
      url: "/stock",
      icon: Package,
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Package className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold">{t('settings.companySettings')}</span>
            <span className="text-xs text-muted-foreground">{t('settings.billSettings')}</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/"}>
                  <Link href="/" data-testid="link-dashboard">
                    <LayoutDashboard className="h-5 w-5" />
                    <span>{t('nav.dashboard')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t('nav.sales')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {salesMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t('nav.masters')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mastersMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t('nav.transactions')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {transactionsMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t('nav.reports')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {reportsMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isSuperAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>{t('settings.title')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/users"}>
                    <Link href="/users" data-testid="link-user-management">
                      <Shield className="h-5 w-5" />
                      <span>{t('nav.userManagement')}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/companies"}>
                    <Link href="/companies" data-testid="link-companies">
                      <Building2 className="h-5 w-5" />
                      <span>{t('nav.companySettings')}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/bill-settings"}>
                    <Link href="/bill-settings" data-testid="link-bill-settings">
                      <FileText className="h-5 w-5" />
                      <span>{t('nav.billSettings')}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={async () => {
            try {
              // Reset company selection state first
              resetCompanySelection();
              await fetch("/api/logout", { method: "POST" });
              window.location.href = "/";
            } catch (error) {
              console.error("Logout error:", error);
              // Still redirect even if logout fails
              resetCompanySelection();
              window.location.href = "/";
            }
          }}
          data-testid="button-logout"
        >
          <LogOut className="mr-2 h-5 w-5" />
          {t('nav.logout')}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
