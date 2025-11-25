import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Company, User } from "@shared/schema";

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
  needsCompanySelection: boolean;
  setCurrentCompany: (company: Company) => void;
  switchCompany: (companyId: number) => void;
  resetCompanySelection: () => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [currentCompany, setCurrentCompanyState] = useState<Company | null>(null);
  const [hasSelectedThisSession, setHasSelectedThisSession] = useState<boolean>(() => {
    // Check if user already selected a company in this browser session
    return sessionStorage.getItem("hasSelectedCompany") === "true";
  });
  const queryClient = useQueryClient();
  const previousUserIdRef = useRef<string | null>(null);

  // Track authenticated user to detect user changes
  const { data: authUser } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const { data: userCompanies = [], isLoading, isError } = useQuery<UserCompany[]>({
    queryKey: ["/api/user-companies"],
    staleTime: 0, // Always treat as stale to ensure fresh data
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  // Reset function to be called on logout/auth change
  const resetCompanySelection = useCallback(() => {
    setCurrentCompanyState(null);
    setHasSelectedThisSession(false);
    sessionStorage.removeItem("hasSelectedCompany");
    localStorage.removeItem("currentCompanyId");
    // Invalidate queries to force refetch on next login
    queryClient.invalidateQueries({ queryKey: ["/api/user-companies"] });
  }, [queryClient]);

  // Watch for auth user changes - reset when user ID changes or becomes undefined
  useEffect(() => {
    const currentUserId = authUser?.id ?? null;
    
    // If user ID changed (including from authenticated to unauthenticated)
    if (previousUserIdRef.current !== null && previousUserIdRef.current !== currentUserId) {
      resetCompanySelection();
    }
    
    previousUserIdRef.current = currentUserId;
  }, [authUser?.id, resetCompanySelection]);

  // Handle userCompanies query error (e.g., 401 unauthorized) - reset state
  useEffect(() => {
    if (isError) {
      setCurrentCompanyState(null);
      setHasSelectedThisSession(false);
      sessionStorage.removeItem("hasSelectedCompany");
      localStorage.removeItem("currentCompanyId");
    }
  }, [isError]);

  // Sync hasSelectedThisSession with sessionStorage on each render
  // This handles cases where storage was cleared but component state wasn't
  useEffect(() => {
    const sessionValue = sessionStorage.getItem("hasSelectedCompany") === "true";
    if (hasSelectedThisSession !== sessionValue) {
      setHasSelectedThisSession(sessionValue);
      // If session was cleared, also clear company selection
      if (!sessionValue) {
        setCurrentCompanyState(null);
      }
    }
  }, [hasSelectedThisSession]);

  // Reset company state when userCompanies becomes empty (logged out)
  useEffect(() => {
    if (!isLoading && userCompanies.length === 0) {
      setCurrentCompanyState(null);
      setHasSelectedThisSession(false);
      sessionStorage.removeItem("hasSelectedCompany");
      localStorage.removeItem("currentCompanyId");
    }
  }, [userCompanies, isLoading]);

  // Validate that saved company ID belongs to current user's companies
  useEffect(() => {
    if (!isLoading && userCompanies.length > 0 && hasSelectedThisSession) {
      const savedCompanyId = localStorage.getItem("currentCompanyId");
      if (savedCompanyId) {
        const savedCompany = userCompanies.find(
          (uc) => uc.companyId === parseInt(savedCompanyId)
        );
        // If saved company doesn't belong to this user, clear selection
        if (!savedCompany) {
          setCurrentCompanyState(null);
          setHasSelectedThisSession(false);
          sessionStorage.removeItem("hasSelectedCompany");
          localStorage.removeItem("currentCompanyId");
        }
      }
    }
  }, [userCompanies, isLoading, hasSelectedThisSession]);

  // Calculate if user needs to select a company
  // Show selection page if: has multiple companies AND hasn't selected one this session
  const needsCompanySelection = !isLoading && 
    userCompanies.length > 1 && 
    !hasSelectedThisSession && 
    !currentCompany;

  useEffect(() => {
    if (userCompanies.length > 0 && !currentCompany) {
      // If user has only ONE company, auto-select it
      if (userCompanies.length === 1) {
        const singleCompany = userCompanies[0].company;
        setCurrentCompanyState(singleCompany);
        localStorage.setItem("currentCompanyId", singleCompany.id.toString());
        sessionStorage.setItem("hasSelectedCompany", "true");
        setHasSelectedThisSession(true);
        return;
      }
      
      // If user has multiple companies BUT already selected one this session
      // (e.g., page refresh), restore from localStorage
      if (hasSelectedThisSession) {
        const savedCompanyId = localStorage.getItem("currentCompanyId");
        if (savedCompanyId) {
          const savedCompany = userCompanies.find(
            (uc) => uc.companyId === parseInt(savedCompanyId)
          );
          if (savedCompany) {
            setCurrentCompanyState(savedCompany.company);
            return;
          }
        }
      }
      
      // Otherwise, user has multiple companies and needs to select one
      // Don't auto-select - let them choose on the selection page
    }
  }, [userCompanies, currentCompany, hasSelectedThisSession]);

  const setCurrentCompany = (company: Company) => {
    setCurrentCompanyState(company);
    localStorage.setItem("currentCompanyId", company.id.toString());
    sessionStorage.setItem("hasSelectedCompany", "true");
    setHasSelectedThisSession(true);
  };

  const switchCompany = (companyId: number) => {
    const userCompany = userCompanies.find((uc) => uc.companyId === companyId);
    if (userCompany) {
      setCurrentCompany(userCompany.company);
      // Invalidate ALL queries to force fresh data fetch for new company
      // This ensures all data displayed is specific to the newly selected company
      queryClient.invalidateQueries();
    }
  };

  return (
    <CompanyContext.Provider
      value={{
        currentCompany,
        userCompanies,
        isLoading,
        needsCompanySelection,
        setCurrentCompany,
        switchCompany,
        resetCompanySelection,
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
