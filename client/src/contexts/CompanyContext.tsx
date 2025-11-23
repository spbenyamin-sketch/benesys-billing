import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Company } from "@shared/schema";

interface UserCompany {
  id: number;
  userId: string;
  companyId: number;
  isDefault: boolean;
  company: Company;
}

interface CompanyContextType {
  currentCompany: Company | null;
  userCompanies: UserCompany[];
  isLoading: boolean;
  setCurrentCompany: (company: Company) => void;
  switchCompany: (companyId: number) => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [currentCompany, setCurrentCompanyState] = useState<Company | null>(null);

  const { data: userCompanies = [], isLoading } = useQuery<UserCompany[]>({
    queryKey: ["/api/user-companies"],
    staleTime: 0, // Always treat as stale to ensure fresh data
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  useEffect(() => {
    if (userCompanies.length > 0 && !currentCompany) {
      const savedCompanyId = localStorage.getItem("currentCompanyId");
      
      let companyToSet: Company | null = null;
      
      if (savedCompanyId) {
        const savedCompany = userCompanies.find(
          (uc) => uc.companyId === parseInt(savedCompanyId)
        );
        if (savedCompany) {
          companyToSet = savedCompany.company;
        }
      }
      
      if (!companyToSet) {
        const defaultCompany = userCompanies.find((uc) => uc.isDefault);
        companyToSet = defaultCompany ? defaultCompany.company : userCompanies[0].company;
      }
      
      if (companyToSet) {
        setCurrentCompanyState(companyToSet);
        localStorage.setItem("currentCompanyId", companyToSet.id.toString());
      }
    }
  }, [userCompanies, currentCompany]);

  const setCurrentCompany = (company: Company) => {
    setCurrentCompanyState(company);
    localStorage.setItem("currentCompanyId", company.id.toString());
  };

  const switchCompany = (companyId: number) => {
    const userCompany = userCompanies.find((uc) => uc.companyId === companyId);
    if (userCompany) {
      setCurrentCompany(userCompany.company);
    }
  };

  return (
    <CompanyContext.Provider
      value={{
        currentCompany,
        userCompanies,
        isLoading,
        setCurrentCompany,
        switchCompany,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
}
