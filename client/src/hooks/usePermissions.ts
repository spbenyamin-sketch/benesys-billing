import { useAuth } from "./useAuth";

export function usePermissions() {
  const { user } = useAuth();

  const canAccess = (pagePath: string): boolean => {
    // Super admins can access everything
    if (user?.role === "admin" || user?.role === "superadmin") {
      return true;
    }

    // Convert page path to permission id
    const pathToPermissionMap: { [key: string]: string } = {
      "/": "dashboard",
      "/parties": "parties",
      "/items": "items",
      "/agents": "agents",
      "/sales": "sales-b2b",
      "/sales/b2b": "sales-b2b",
      "/sales/b2c": "sales-b2c",
      "/sales/estimate": "sales-estimate",
      "/sales/credit-note": "sales-credit-note",
      "/sales/debit-note": "sales-debit-note",
      "/sales/new": "sales-b2b",
      "/bill-entry": "sales-b2b",
      "/purchases": "purchases",
      "/purchase-entry": "purchases",
      "/purchases/new": "purchases",
      "/stock": "stock",
      "/stock/view": "stock",
      "/stock-inward": "stock",
      "/payments": "payments",
      "/barcode-management": "barcode-management",
      "/barcode-lookup": "barcode-management",
      "/reports": "reports",
      "/reports/outstanding": "reports",
      "/reports/sales": "reports",
      "/reports/purchases": "reports",
      "/reports/items": "reports",
      "/reports/categories": "reports",
      "/reports/payments": "reports",
      "/reports/ledger": "reports",
      "/bill-settings": "bill-settings",
      "/users": "users",
    };

    const permissionId = pathToPermissionMap[pagePath] || pagePath;
    const pagePermissions = (user?.pagePermissions as string[]) || [];
    
    return pagePermissions.includes(permissionId);
  };

  return { canAccess };
}
