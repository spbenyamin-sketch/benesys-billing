import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Package, BarChart3, Users, FileText } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Package className="h-12 w-12" />
            </div>
          </div>

          <h1 className="mb-4 text-4xl font-semibold tracking-tight">
            Store Management & Billing System
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Complete billing solution with GST support, inventory management, and comprehensive reporting
          </p>

          <Button
            size="lg"
            className="mb-16"
            onClick={() => {
              window.location.href = "/api/login";
            }}
            data-testid="button-login"
          >
            Log In to Continue
          </Button>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="mb-2 font-medium">GST Billing</h3>
                <p className="text-sm text-muted-foreground">
                  Generate GST & estimate invoices with automatic tax calculations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Package className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="mb-2 font-medium">Inventory</h3>
                <p className="text-sm text-muted-foreground">
                  Track stock levels and manage product catalog
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Users className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="mb-2 font-medium">Customers</h3>
                <p className="text-sm text-muted-foreground">
                  Manage parties with outstanding balance tracking
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="mb-2 font-medium">Reports</h3>
                <p className="text-sm text-muted-foreground">
                  Sales, outstanding, and party ledger reports
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
