import { describe, it, expect } from "vitest";
import type {
  Car,
  Profile,
  UserRole,
  CarStatus,
  SaleType,
  InstallmentStatus,
  PaymentMethod,
} from "@/lib/types";

describe("Type definitions", () => {
  it("Car type has required fields", () => {
    const car: Car = {
      id: "uuid-1",
      tenant_id: "tenant-1",
      vin: "ABC123",
      make: "Toyota",
      model: "Corolla",
      year: 2024,
      color: "White",
      mileage_km: 15000,
      condition: "used",
      purchase_price: 500000,
      market_price: 600000,
      currency: "EGP",
      seller_name: "Ahmed",
      seller_phone: "+201000000000",
      seller_national_id: null,
      status: "available",
      images: [],
      notes: null,
      added_by: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };

    expect(car.make).toBe("Toyota");
    expect(car.status).toBe("available");
    expect(car.market_price).toBeGreaterThan(car.purchase_price);
  });

  it("Profile type enforces roles", () => {
    const admin: Profile = {
      id: "uuid-2",
      tenant_id: "tenant-1",
      role: "admin",
      full_name: "Omar",
      full_name_ar: "عمر",
      avatar_url: null,
      phone: null,
      is_active: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };

    const validRoles: UserRole[] = ["admin", "employee"];
    expect(validRoles).toContain(admin.role);
  });

  it("Installment statuses are correct", () => {
    const statuses: InstallmentStatus[] = [
      "upcoming",
      "paid",
      "overdue",
      "partially_paid",
    ];
    expect(statuses).toHaveLength(4);
    expect(statuses).toContain("overdue");
  });

  it("Payment methods include Egyptian providers", () => {
    const methods: PaymentMethod[] = [
      "cash",
      "vodafone_cash",
      "instapay",
      "bank_transfer",
      "other",
    ];
    expect(methods).toContain("vodafone_cash");
    expect(methods).toContain("instapay");
  });

  it("Car statuses cover full lifecycle", () => {
    const statuses: CarStatus[] = ["available", "reserved", "sold"];
    expect(statuses).toHaveLength(3);
  });

  it("Sale types are cash or installment", () => {
    const types: SaleType[] = ["cash", "installment"];
    expect(types).toHaveLength(2);
  });
});
