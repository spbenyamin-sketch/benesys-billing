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
  Calendar,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/contexts/CompanyContext";

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { resetCompanySelection } = useCompany();
  const isSuperAdmin = user?.role === "superadmin";
  const isAdminCustomer = user?.role === "admin";

  const salesMenuItems = [
    {
      title: "B2B Credit Sale",
      url: "/sales/b2b",
      icon: Briefcase,
    },
    {
      title: "Proforma Invoice",
      url: "/sales/proforma",
      icon: Briefcase,
    },
    {
      title: "B2C Retail Sale",
      url: "/sales/b2c",
      icon: Store,
    },
    {
      title: "Estimate",
      url: "/sales/estimate",
      icon: FileEdit,
    },
    {
      title: "Credit Note",
      url: "/sales/credit-note",
      icon: CreditCard,
    },
    {
      title: "Debit Note",
      url: "/sales/debit-note",
      icon: CreditCard,
    },
    {
      title: "Sales List",
      url: "/sales",
      icon: ShoppingCart,
    },
  ];

  const mastersMenuItems = [
    {
      title: "Customers",
      url: "/parties",
      icon: Users,
    },
    {
      title: "Items",
      url: "/items",
      icon: Package,
    },
    {
      title: "Agents",
      url: "/agents",
      icon: UserCircle,
    },
  ];

  const transactionsMenuItems = [
    {
      title: "Purchase Entry",
      url: "/purchase-entry",
      icon: FileText,
    },
    {
      title: "Stock Inward",
      url: "/stock-inward",
      icon: PackagePlus,
    },
    {
      title: "Barcode Management",
      url: "/barcode-management",
      icon: Barcode,
    },
    {
      title: "Barcode Lookup",
      url: "/barcode-lookup",
      icon: Barcode,
    },
    {
      title: "Payments",
      url: "/payments",
      icon: Wallet,
    },
  ];

  const reportsMenuItems = [
    {
      title: "Outstanding",
      url: "/reports/outstanding",
      icon: BarChart3,
    },
    {
      title: "Sales Report",
      url: "/reports/sales",
      icon: FileText,
    },
    {
      title: "Sales Total Report",
      url: "/reports/sales-total",
      icon: BarChart3,
    },
    {
      title: "Purchase Report",
      url: "/reports/purchases",
      icon: ShoppingCart,
    },
    {
      title: "Item Wise Sales",
      url: "/reports/items",
      icon: Package,
    },
    {
      title: "Category Wise Sales",
      url: "/reports/categories",
      icon: BarChart3,
    },
    {
      title: "Payment Report",
      url: "/reports/payments",
      icon: Wallet,
    },
    {
      title: "Agent Commission",
      url: "/reports/agent-commission",
      icon: Users,
    },
    {
      title: "Stock",
      url: "/stock",
      icon: Package,
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-2 py-3">
        <Link href="/" className="flex items-center justify-center w-full">
          <p className="text-sm font-bold">BeneSys</p>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/"}>
                  <Link href="/" data-testid="link-dashboard" tabIndex={-1}>
                    <LayoutDashboard className="h-5 w-5" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Sales</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {salesMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`} tabIndex={-1}>
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
          <SidebarGroupLabel>Masters</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mastersMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase()}`} tabIndex={-1}>
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
          <SidebarGroupLabel>Transactions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {transactionsMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase()}`} tabIndex={-1}>
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
          <SidebarGroupLabel>Reports</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {reportsMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`} tabIndex={-1}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {(isSuperAdmin || isAdminCustomer) && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/users"}>
                    <Link href="/users" data-testid="link-user-management" tabIndex={-1}>
                      <Shield className="h-5 w-5" />
                      <span>User Management</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {isSuperAdmin && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/companies"}>
                      <Link href="/companies" data-testid="link-companies" tabIndex={-1}>
                        <Building2 className="h-5 w-5" />
                        <span>Companies</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/bill-settings"}>
                    <Link href="/bill-settings" data-testid="link-bill-settings" tabIndex={-1}>
                      <FileText className="h-5 w-5" />
                      <span>Bill Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/financial-years"}>
                    <Link href="/financial-years" data-testid="link-financial-years" tabIndex={-1}>
                      <Calendar className="h-5 w-5" />
                      <span>Financial Years</span>
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
          tabIndex={-1}
        >
          <LogOut className="mr-2 h-5 w-5" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
