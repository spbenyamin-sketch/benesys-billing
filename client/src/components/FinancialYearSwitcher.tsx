import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface FinancialYear {
  id: number;
  companyId: number;
  label: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isClosed: boolean;
}

export function FinancialYearSwitcher() {
  const { toast } = useToast();

  const { data: financialYears, isLoading: fyLoading } = useQuery<FinancialYear[]>({
    queryKey: ["/api/financial-years"],
  });

  const { data: activeFY, isLoading: activeLoading } = useQuery<FinancialYear | null>({
    queryKey: ["/api/financial-years/active"],
  });

  const activateMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("POST", `/api/financial-years/${id}/activate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial-years"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-years/active"] });
      toast({
        title: "Financial Year Changed",
        description: "New transactions will use the selected financial year.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change financial year",
        variant: "destructive",
      });
    },
  });

  if (fyLoading || activeLoading) {
    return <Skeleton className="h-9 w-32" />;
  }

  if (!financialYears || financialYears.length === 0) {
    return (
      <Badge variant="outline" className="gap-1">
        <Calendar className="h-3 w-3" />
        No FY
      </Badge>
    );
  }

  const handleFYChange = (value: string) => {
    const fyId = parseInt(value);
    if (fyId && fyId !== activeFY?.id) {
      activateMutation.mutate(fyId);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={activeFY?.id?.toString() || ""}
        onValueChange={handleFYChange}
        disabled={activateMutation.isPending}
      >
        <SelectTrigger
          className="h-9 w-auto min-w-[100px] gap-1"
          data-testid="select-financial-year"
        >
          {activateMutation.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Calendar className="h-3 w-3" />
          )}
          <SelectValue placeholder="Select FY" />
        </SelectTrigger>
        <SelectContent>
          {financialYears.map((fy) => (
            <SelectItem key={fy.id} value={fy.id.toString()} data-testid={`option-fy-${fy.id}`}>
              <div className="flex items-center gap-2">
                <span>FY {fy.label}</span>
                {fy.isActive && (
                  <Badge variant="secondary" className="text-xs py-0">
                    Active
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
