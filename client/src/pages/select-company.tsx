import { useCompany } from "@/contexts/CompanyContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Phone, Mail, Check, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { Company } from "@shared/schema";

export default function SelectCompany() {
  const { setCurrentCompany, currentCompany, userCompanies, isLoading, resetCompanySelection } = useCompany();
  const { user } = useAuth();

  const handleSelectCompany = (company: Company) => {
    setCurrentCompany(company);
  };

  const handleLogout = async () => {
    try {
      // Reset company selection state first
      resetCompanySelection();
      await fetch("/api/logout", { method: "POST", credentials: "include" });
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Building2 className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading companies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">
              Select Company
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome, {user?.firstName || user?.username}! Choose a company to continue.
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Company Cards Grid */}
        {userCompanies && userCompanies.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {userCompanies.map((uc) => (
              <Card 
                key={uc.companyId}
                className={`cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 ${
                  currentCompany?.id === uc.company.id 
                    ? "border-primary ring-2 ring-primary/20" 
                    : ""
                }`}
                onClick={() => handleSelectCompany(uc.company)}
                data-testid={`card-company-${uc.companyId}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg" data-testid={`text-company-name-${uc.companyId}`}>
                          {uc.company.name}
                        </CardTitle>
                        {uc.isDefault && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                    {currentCompany?.id === uc.company.id && (
                      <div className="p-1 rounded-full bg-primary text-primary-foreground">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {uc.company.city && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span data-testid={`text-company-city-${uc.companyId}`}>
                        {uc.company.city}{uc.company.state ? `, ${uc.company.state}` : ""}
                      </span>
                    </div>
                  )}
                  {uc.company.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{uc.company.phone}</span>
                    </div>
                  )}
                  {uc.company.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{uc.company.email}</span>
                    </div>
                  )}
                  {uc.company.gstNo && (
                    <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                      GST: {uc.company.gstNo}
                    </div>
                  )}
                  
                  <Button 
                    className="w-full mt-4" 
                    variant={currentCompany?.id === uc.company.id ? "default" : "outline"}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectCompany(uc.company);
                    }}
                    data-testid={`button-select-company-${uc.companyId}`}
                  >
                    {currentCompany?.id === uc.company.id ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Selected - Continue
                      </>
                    ) : (
                      "Select Company"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>No Companies Available</CardTitle>
              <CardDescription>
                You don't have access to any companies yet. Please contact your administrator.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={handleLogout} className="w-full">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Info text */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          You can switch companies anytime using the company switcher in the header.
        </p>
      </div>
    </div>
  );
}
