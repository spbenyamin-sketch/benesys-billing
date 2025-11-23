import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Plus } from "lucide-react";
import { useLocation } from "wouter";

export function CompanySelector() {
  const { userCompanies, currentCompany, setCurrentCompany, isLoading } = useCompany();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const isSuperAdmin = user?.role === "admin";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg">Loading companies...</div>
        </div>
      </div>
    );
  }

  if (currentCompany) {
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-2xl mx-4">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl">Select Company</CardTitle>
              <CardDescription>Choose a company to continue</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {userCompanies.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg mb-2 font-semibold">No companies available</p>
              {isSuperAdmin ? (
                <>
                  <p className="text-sm text-muted-foreground mb-6">
                    Get started by creating your first company
                  </p>
                  <Button 
                    onClick={() => setLocation("/companies")} 
                    size="lg"
                    data-testid="button-create-first-company"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Company
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Please contact your administrator to get access to a company.
                </p>
              )}
            </div>
          ) : (
            <div className="grid gap-3">
              {userCompanies.map((userCompany) => (
                <Card
                  key={userCompany.id}
                  className="hover-elevate transition-colors cursor-pointer"
                  onClick={() => setCurrentCompany(userCompany.company)}
                  data-testid={`card-company-${userCompany.companyId}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold" data-testid={`text-company-name-${userCompany.companyId}`}>
                            {userCompany.company.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {userCompany.company.city && userCompany.company.state
                              ? `${userCompany.company.city}, ${userCompany.company.state}`
                              : userCompany.company.address}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentCompany(userCompany.company);
                        }}
                        data-testid={`button-select-company-${userCompany.companyId}`}
                      >
                        Select
                      </Button>
                    </div>
                    {userCompany.isDefault && (
                      <div className="mt-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        Default
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
