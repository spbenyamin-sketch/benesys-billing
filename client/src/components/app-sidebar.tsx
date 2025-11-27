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
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/contexts/CompanyContext";

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { resetCompanySelection } = useCompany();
  const isSuperAdmin = user?.role === "admin";

  const salesMenuItems = [
    {
      title: "B2B Credit Sale",
      url: "/sales/b2b",
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
      title: "Purchase Report",
      url: "/reports/purchases",
      icon: ShoppingCart,
    },
    {
      title: "Item Report",
      url: "/reports/items",
      icon: Package,
    },
    {
      title: "Stock",
      url: "/stock",
      icon: Package,
    },
    {
      title: "Stock View",
      url: "/stock/view",
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
            <span className="text-base font-semibold">Store Management</span>
            <span className="text-xs text-muted-foreground">Billing System</span>
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
          <SidebarGroupLabel>Masters</SidebarGroupLabel>
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
          <SidebarGroupLabel>Transactions</SidebarGroupLabel>
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
          <SidebarGroupLabel>Reports</SidebarGroupLabel>
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
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/users"}>
                    <Link href="/users" data-testid="link-user-management">
                      <Shield className="h-5 w-5" />
                      <span>User Management</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/companies"}>
                    <Link href="/companies" data-testid="link-companies">
                      <Building2 className="h-5 w-5" />
                      <span>Companies</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/bill-settings"}>
                    <Link href="/bill-settings" data-testid="link-bill-settings">
                      <FileText className="h-5 w-5" />
                      <span>Bill Settings</span>
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
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
