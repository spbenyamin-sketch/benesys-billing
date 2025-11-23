import { useCompany } from "@/contexts/CompanyContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building2, ChevronDown, Check } from "lucide-react";

export function CompanySwitcher() {
  const { userCompanies, currentCompany, switchCompany, isLoading } = useCompany();

  if (isLoading || !currentCompany) {
    return null;
  }

  if (userCompanies.length <= 1) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-switch-company">
          <Building2 className="mr-2 h-4 w-4" />
          Switch Company
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Switch Company</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {userCompanies.map((userCompany) => (
          <DropdownMenuItem
            key={userCompany.id}
            onClick={() => switchCompany(userCompany.companyId)}
            className="cursor-pointer"
            data-testid={`menu-item-company-${userCompany.companyId}`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{userCompany.company.name}</div>
                  {userCompany.company.city && (
                    <div className="text-xs text-muted-foreground">
                      {userCompany.company.city}
                      {userCompany.company.state && `, ${userCompany.company.state}`}
                    </div>
                  )}
                </div>
              </div>
              {currentCompany.id === userCompany.companyId && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
