import type { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { userCompanies, companies, users } from "@shared/schema";
import { and, eq } from "drizzle-orm";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
  companyId?: number;
}

export async function validateCompanyAccess(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const companyIdHeader = req.headers["x-company-id"] as string;
  
  if (!companyIdHeader) {
    return res.status(400).json({ message: "Company ID is required" });
  }
  
  const companyId = parseInt(companyIdHeader);
  
  if (isNaN(companyId)) {
    return res.status(400).json({ message: "Invalid company ID" });
  }
  
  const userId = req.user?.id;
  
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // Check if user has access to this company
  const [userCompany] = await db
    .select()
    .from(userCompanies)
    .where(
      and(
        eq(userCompanies.userId, userId),
        eq(userCompanies.companyId, companyId)
      )
    )
    .limit(1);
  
  if (!userCompany) {
    return res.status(403).json({ message: "Access to this company is forbidden" });
  }
  
  // Get user role to check if superadmin
  const [currentUser] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  const isSuperAdmin = currentUser?.role === 'superadmin';
  
  // Check company expiry date (superadmin bypasses this check)
  if (!isSuperAdmin) {
    const [company] = await db
      .select({ expiryDate: companies.expiryDate })
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);
    
    if (company?.expiryDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiryDate = new Date(company.expiryDate);
      expiryDate.setHours(0, 0, 0, 0);
      
      if (expiryDate < today) {
        return res.status(403).json({ 
          message: "Company license has expired. Please contact administrator.",
          expired: true
        });
      }
    }
  }
  
  req.companyId = companyId;
  next();
}
