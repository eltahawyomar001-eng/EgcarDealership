import { describe, it, expect } from "vitest";
import type {
  Car,
  Profile,
  UserRole,
  CarStatus,
  SaleType,
  InstallmentStatus,
  PaymentMethod,
  CarCondition,
  SaleStatus,
  AttendanceType,
  AdjustmentType,
  AdjustmentScope,
  Sale,
  Installment,
  Attendance,
  Tenant,
  DealershipValuation,
  PriceAdjustment,
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

    const validRoles: UserRole[] = ["admin", "manager", "employee"];
    expect(validRoles).toContain(admin.role);
  });

  it("Manager role is valid", () => {
    const manager: Profile = {
      id: "uuid-3",
      tenant_id: "tenant-1",
      role: "manager",
      full_name: "Manager",
      full_name_ar: "مدير",
      avatar_url: null,
      phone: null,
      is_active: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
    expect(manager.role).toBe("manager");
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

describe("Extended type definitions", () => {
  it("Car conditions cover new and used", () => {
    const conditions: CarCondition[] = ["new", "used"];
    expect(conditions).toHaveLength(2);
    expect(conditions).toContain("new");
    expect(conditions).toContain("used");
  });

  it("Sale statuses cover full lifecycle", () => {
    const statuses: SaleStatus[] = ["pending", "completed", "cancelled"];
    expect(statuses).toHaveLength(3);
    expect(statuses).toContain("pending");
    expect(statuses).toContain("completed");
    expect(statuses).toContain("cancelled");
  });

  it("Attendance types are clock_in and clock_out", () => {
    const types: AttendanceType[] = ["clock_in", "clock_out"];
    expect(types).toHaveLength(2);
  });

  it("Adjustment types are percentage and fixed", () => {
    const types: AdjustmentType[] = ["percentage", "fixed"];
    expect(types).toHaveLength(2);
  });

  it("Adjustment scopes include all, filtered, single", () => {
    const scopes: AdjustmentScope[] = ["all", "filtered", "single"];
    expect(scopes).toHaveLength(3);
  });

  it("Sale type has all required fields", () => {
    const sale: Sale = {
      id: "sale-1",
      tenant_id: "tenant-1",
      car_id: "car-1",
      buyer_name: "Ahmed Mohamed",
      buyer_phone: "+201012345678",
      buyer_national_id: "29001011234567",
      buyer_address: "Cairo, Egypt",
      sale_type: "cash",
      sale_price: 650000,
      down_payment: 650000,
      remaining_amount: 0,
      currency: "EGP",
      status: "completed",
      sold_by: "user-1",
      sold_at: "2026-01-15T10:00:00Z",
      created_at: "2026-01-15T10:00:00Z",
      updated_at: "2026-01-15T10:00:00Z",
    };
    expect(sale.buyer_name).toBe("Ahmed Mohamed");
    expect(sale.remaining_amount).toBe(0);
    expect(sale.sale_type).toBe("cash");
  });

  it("Sale with installment has remaining amount", () => {
    const sale: Sale = {
      id: "sale-2",
      tenant_id: "tenant-1",
      car_id: "car-2",
      buyer_name: "Khaled Ali",
      buyer_phone: "+201098765432",
      buyer_national_id: null,
      buyer_address: null,
      sale_type: "installment",
      sale_price: 800000,
      down_payment: 200000,
      remaining_amount: 600000,
      currency: "EGP",
      status: "pending",
      sold_by: null,
      sold_at: "2026-02-01T10:00:00Z",
      created_at: "2026-02-01T10:00:00Z",
      updated_at: "2026-02-01T10:00:00Z",
    };
    expect(sale.remaining_amount).toBe(600000);
    expect(sale.down_payment + sale.remaining_amount).toBe(sale.sale_price);
  });

  it("Installment type has all required fields", () => {
    const installment: Installment = {
      id: "inst-1",
      tenant_id: "tenant-1",
      sale_id: "sale-2",
      installment_number: 1,
      due_date: "2026-03-01",
      amount_due: 50000,
      amount_paid: 50000,
      payment_method: "vodafone_cash",
      payment_date: "2026-03-01",
      payment_reference: "VC-12345",
      payment_screenshot_url: null,
      status: "paid",
      notes: null,
      recorded_by: "user-1",
      created_at: "2026-02-01T10:00:00Z",
      updated_at: "2026-03-01T10:00:00Z",
    };
    expect(installment.amount_paid).toBe(installment.amount_due);
    expect(installment.status).toBe("paid");
  });

  it("Attendance type has GPS coordinates", () => {
    const record: Attendance = {
      id: "att-1",
      tenant_id: "tenant-1",
      user_id: "user-1",
      event_type: "clock_in",
      timestamp: "2026-03-18T08:00:00Z",
      latitude: 30.0444,
      longitude: 31.2357,
      accuracy_meters: 5,
      address_snapshot: "Cairo, Egypt",
      device_info: "iPhone 15",
      created_at: "2026-03-18T08:00:00Z",
    };
    expect(record.latitude).toBeCloseTo(30.0444);
    expect(record.longitude).toBeCloseTo(31.2357);
    expect(record.event_type).toBe("clock_in");
  });

  it("Tenant type has bilingual fields", () => {
    const tenant: Tenant = {
      id: "tenant-1",
      name: "Al Moalem Motors",
      name_ar: "معرض المعلم للسيارات",
      slug: "al-moalem-motors",
      logo_url: null,
      address: "Nasr City, Cairo",
      address_ar: "مدينة نصر، القاهرة",
      phone: "+201000000000",
      currency: "EGP",
      timezone: "Africa/Cairo",
      is_active: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
    expect(tenant.currency).toBe("EGP");
    expect(tenant.timezone).toBe("Africa/Cairo");
    expect(tenant.name_ar).toBeTruthy();
  });

  it("DealershipValuation has all aggregate fields", () => {
    const valuation: DealershipValuation = {
      tenant_id: "tenant-1",
      available_count: 15,
      reserved_count: 3,
      sold_count: 7,
      total_count: 25,
      available_value: 7500000,
      reserved_value: 1800000,
      realized_profit: 420000,
      potential_profit: 1200000,
    };
    expect(valuation.total_count).toBe(
      valuation.available_count +
        valuation.reserved_count +
        valuation.sold_count,
    );
    expect(valuation.available_value).toBeGreaterThan(0);
  });

  it("PriceAdjustment captures audit trail", () => {
    const adj: PriceAdjustment = {
      id: "adj-1",
      tenant_id: "tenant-1",
      adjustment_type: "percentage",
      adjustment_value: 5,
      scope: "all",
      car_id: null,
      filter_make: null,
      filter_model: null,
      filter_year_min: null,
      filter_year_max: null,
      cars_affected: 15,
      total_before: 7500000,
      total_after: 7875000,
      applied_by: "user-1",
      applied_at: "2026-03-18T10:00:00Z",
    };
    expect(adj.cars_affected).toBe(15);
    expect(adj.scope).toBe("all");
    expect(adj.adjustment_type).toBe("percentage");
  });

  it("Car has optional nullable fields", () => {
    const car: Car = {
      id: "car-minimal",
      tenant_id: "tenant-1",
      vin: null,
      make: "Hyundai",
      model: "Elantra",
      year: 2023,
      color: null,
      mileage_km: 0,
      condition: "new",
      purchase_price: 800000,
      market_price: 900000,
      currency: "EGP",
      seller_name: null,
      seller_phone: null,
      seller_national_id: null,
      status: "available",
      images: [],
      notes: null,
      added_by: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
    expect(car.vin).toBeNull();
    expect(car.color).toBeNull();
    expect(car.seller_name).toBeNull();
    expect(car.images).toEqual([]);
    expect(car.condition).toBe("new");
  });

  it("Profile enforces all three roles", () => {
    const roles: UserRole[] = ["admin", "manager", "employee"];
    roles.forEach((role) => {
      const profile: Profile = {
        id: `user-${role}`,
        tenant_id: "tenant-1",
        role,
        full_name: `Test ${role}`,
        full_name_ar: null,
        avatar_url: null,
        phone: null,
        is_active: true,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      };
      expect(profile.role).toBe(role);
    });
  });
});
