import type { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { userCompanies } from "@shared/schema";
import { and, eq } from "drizzle-orm";

export interface AuthenticatedRequest extends Request {
  user?: {
    claims: {
      sub: string;
    };
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
  
  const userId = req.user?.claims.sub;
  
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
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
  
  req.companyId = companyId;
  next();
}
