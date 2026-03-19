"use client";

import { useAuth } from "@/components/providers/auth-provider";
import type { UserRole } from "@/lib/types";

/**
 * RBAC Permission Matrix:
 *
 * | Permission           | admin | manager | employee |
 * |----------------------|-------|---------|----------|
 * | canViewPrices        | yes   | yes     | market   |
 * | canViewPurchasePrice | yes   | yes     | no       |
 * | canViewProfit        | yes   | yes     | no       |
 * | canChangePrices      | yes   | yes     | no       |
 * | canDeleteRecords     | yes   | no      | no       |
 * | canViewAllAttendance | yes   | yes     | no       |
 * | canVerifyPayments    | yes   | yes     | no       |
 * | canAccessSettings    | yes   | yes     | no       |
 * | canViewValuation     | yes   | yes     | no       |
 * | canManageEmployees   | yes   | no      | no       |
 */

export interface RolePermissions {
  role: UserRole;
  isAdmin: boolean;
  isManager: boolean;
  isEmployee: boolean;
  isManagerOrAdmin: boolean;
  canViewPurchasePrice: boolean;
  canViewProfit: boolean;
  canChangePrices: boolean;
  canDeleteRecords: boolean;
  canViewAllAttendance: boolean;
  canVerifyPayments: boolean;
  canAccessSettings: boolean;
  canViewValuation: boolean;
  canManageEmployees: boolean;
  canCreateSales: boolean;
  canAddCars: boolean;
  roleLabel: string;
}

export function useRole(): RolePermissions {
  const { user } = useAuth();
  const role: UserRole = user?.role ?? "employee";

  const isAdmin = role === "admin";
  const isManager = role === "manager";
  const isEmployee = role === "employee";
  const isManagerOrAdmin = isAdmin || isManager;

  return {
    role,
    isAdmin,
    isManager,
    isEmployee,
    isManagerOrAdmin,
    canViewPurchasePrice: isManagerOrAdmin,
    canViewProfit: isManagerOrAdmin,
    canChangePrices: isManagerOrAdmin,
    canDeleteRecords: isAdmin,
    canViewAllAttendance: isManagerOrAdmin,
    canVerifyPayments: isManagerOrAdmin,
    canAccessSettings: isManagerOrAdmin,
    canViewValuation: isManagerOrAdmin,
    canManageEmployees: isAdmin,
    canCreateSales: true, // All roles can create sales
    canAddCars: true, // All roles can add cars
    roleLabel: isAdmin
      ? "rbac.ownerAccount"
      : isManager
        ? "rbac.managerAccount"
        : "rbac.staffAccount",
  };
}
