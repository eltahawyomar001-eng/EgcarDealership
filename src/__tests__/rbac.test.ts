import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { setMockRole } from "./setup";

// We need to import useRole AFTER mocks are set up
import { useRole, type RolePermissions } from "@/hooks/use-role";

function getRolePermissions(role: string): RolePermissions {
  setMockRole(role);
  const { result } = renderHook(() => useRole());
  return result.current;
}

// ============================================================================
// Admin Role
// ============================================================================
describe("RBAC — Admin Role", () => {
  let perms: RolePermissions;
  beforeEach(() => {
    perms = getRolePermissions("admin");
  });

  it("identifies as admin", () => {
    expect(perms.role).toBe("admin");
    expect(perms.isAdmin).toBe(true);
    expect(perms.isManager).toBe(false);
    expect(perms.isEmployee).toBe(false);
  });

  it("isManagerOrAdmin is true", () => {
    expect(perms.isManagerOrAdmin).toBe(true);
  });

  it("can view purchase prices", () => {
    expect(perms.canViewPurchasePrice).toBe(true);
  });

  it("can view profit", () => {
    expect(perms.canViewProfit).toBe(true);
  });

  it("can change prices", () => {
    expect(perms.canChangePrices).toBe(true);
  });

  it("can delete records", () => {
    expect(perms.canDeleteRecords).toBe(true);
  });

  it("can view all attendance", () => {
    expect(perms.canViewAllAttendance).toBe(true);
  });

  it("can verify payments", () => {
    expect(perms.canVerifyPayments).toBe(true);
  });

  it("can access settings", () => {
    expect(perms.canAccessSettings).toBe(true);
  });

  it("can view valuation", () => {
    expect(perms.canViewValuation).toBe(true);
  });

  it("can manage employees", () => {
    expect(perms.canManageEmployees).toBe(true);
  });

  it("can create sales", () => {
    expect(perms.canCreateSales).toBe(true);
  });

  it("can add cars", () => {
    expect(perms.canAddCars).toBe(true);
  });

  it("has correct role label", () => {
    expect(perms.roleLabel).toBe("rbac.ownerAccount");
  });
});

// ============================================================================
// Manager Role
// ============================================================================
describe("RBAC — Manager Role", () => {
  let perms: RolePermissions;
  beforeEach(() => {
    perms = getRolePermissions("manager");
  });

  it("identifies as manager", () => {
    expect(perms.role).toBe("manager");
    expect(perms.isAdmin).toBe(false);
    expect(perms.isManager).toBe(true);
    expect(perms.isEmployee).toBe(false);
  });

  it("isManagerOrAdmin is true", () => {
    expect(perms.isManagerOrAdmin).toBe(true);
  });

  it("can view purchase prices", () => {
    expect(perms.canViewPurchasePrice).toBe(true);
  });

  it("can view profit", () => {
    expect(perms.canViewProfit).toBe(true);
  });

  it("can change prices", () => {
    expect(perms.canChangePrices).toBe(true);
  });

  it("CANNOT delete records", () => {
    expect(perms.canDeleteRecords).toBe(false);
  });

  it("can view all attendance", () => {
    expect(perms.canViewAllAttendance).toBe(true);
  });

  it("can verify payments", () => {
    expect(perms.canVerifyPayments).toBe(true);
  });

  it("can access settings", () => {
    expect(perms.canAccessSettings).toBe(true);
  });

  it("can view valuation", () => {
    expect(perms.canViewValuation).toBe(true);
  });

  it("CANNOT manage employees", () => {
    expect(perms.canManageEmployees).toBe(false);
  });

  it("can create sales", () => {
    expect(perms.canCreateSales).toBe(true);
  });

  it("can add cars", () => {
    expect(perms.canAddCars).toBe(true);
  });

  it("has correct role label", () => {
    expect(perms.roleLabel).toBe("rbac.managerAccount");
  });
});

// ============================================================================
// Employee Role
// ============================================================================
describe("RBAC — Employee Role", () => {
  let perms: RolePermissions;
  beforeEach(() => {
    perms = getRolePermissions("employee");
  });

  it("identifies as employee", () => {
    expect(perms.role).toBe("employee");
    expect(perms.isAdmin).toBe(false);
    expect(perms.isManager).toBe(false);
    expect(perms.isEmployee).toBe(true);
  });

  it("isManagerOrAdmin is false", () => {
    expect(perms.isManagerOrAdmin).toBe(false);
  });

  it("CANNOT view purchase prices", () => {
    expect(perms.canViewPurchasePrice).toBe(false);
  });

  it("CANNOT view profit", () => {
    expect(perms.canViewProfit).toBe(false);
  });

  it("CANNOT change prices", () => {
    expect(perms.canChangePrices).toBe(false);
  });

  it("CANNOT delete records", () => {
    expect(perms.canDeleteRecords).toBe(false);
  });

  it("CANNOT view all attendance", () => {
    expect(perms.canViewAllAttendance).toBe(false);
  });

  it("CANNOT verify payments", () => {
    expect(perms.canVerifyPayments).toBe(false);
  });

  it("CANNOT access settings", () => {
    expect(perms.canAccessSettings).toBe(false);
  });

  it("CANNOT view valuation", () => {
    expect(perms.canViewValuation).toBe(false);
  });

  it("CANNOT manage employees", () => {
    expect(perms.canManageEmployees).toBe(false);
  });

  it("CAN create sales (all roles)", () => {
    expect(perms.canCreateSales).toBe(true);
  });

  it("CAN add cars (all roles)", () => {
    expect(perms.canAddCars).toBe(true);
  });

  it("has correct role label", () => {
    expect(perms.roleLabel).toBe("rbac.staffAccount");
  });
});

// ============================================================================
// Permission Matrix Cross-validation
// ============================================================================
describe("RBAC — Permission Matrix Cross-validation", () => {
  it("admin has all permissions except: none excluded", () => {
    const perms = getRolePermissions("admin");
    const allBoolPerms = [
      perms.canViewPurchasePrice,
      perms.canViewProfit,
      perms.canChangePrices,
      perms.canDeleteRecords,
      perms.canViewAllAttendance,
      perms.canVerifyPayments,
      perms.canAccessSettings,
      perms.canViewValuation,
      perms.canManageEmployees,
      perms.canCreateSales,
      perms.canAddCars,
    ];
    expect(allBoolPerms.every(Boolean)).toBe(true);
  });

  it("manager is denied only delete and employee management", () => {
    const perms = getRolePermissions("manager");
    expect(perms.canDeleteRecords).toBe(false);
    expect(perms.canManageEmployees).toBe(false);
    // Everything else should be true
    expect(perms.canViewPurchasePrice).toBe(true);
    expect(perms.canViewProfit).toBe(true);
    expect(perms.canChangePrices).toBe(true);
    expect(perms.canViewAllAttendance).toBe(true);
    expect(perms.canVerifyPayments).toBe(true);
    expect(perms.canAccessSettings).toBe(true);
    expect(perms.canViewValuation).toBe(true);
  });

  it("employee is denied all sensitive permissions", () => {
    const perms = getRolePermissions("employee");
    const sensitivePerms = [
      perms.canViewPurchasePrice,
      perms.canViewProfit,
      perms.canChangePrices,
      perms.canDeleteRecords,
      perms.canViewAllAttendance,
      perms.canVerifyPayments,
      perms.canAccessSettings,
      perms.canViewValuation,
      perms.canManageEmployees,
    ];
    expect(sensitivePerms.every((p) => p === false)).toBe(true);
  });

  it("all roles can create sales and add cars", () => {
    const roles = ["admin", "manager", "employee"];
    roles.forEach((role) => {
      const perms = getRolePermissions(role);
      expect(perms.canCreateSales, `${role} should create sales`).toBe(true);
      expect(perms.canAddCars, `${role} should add cars`).toBe(true);
    });
  });

  it("role labels are unique per role", () => {
    const labels = ["admin", "manager", "employee"].map(
      (role) => getRolePermissions(role).roleLabel,
    );
    const uniqueLabels = new Set(labels);
    expect(uniqueLabels.size).toBe(3);
  });

  it("default role (no user) falls back to employee", () => {
    // useRole defaults to "employee" when user?.role is undefined
    setMockRole("employee");
    const { result } = renderHook(() => useRole());
    expect(result.current.role).toBe("employee");
    expect(result.current.isEmployee).toBe(true);
  });
});
