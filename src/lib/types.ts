// ============================================================================
// CarOS Egypt — TypeScript Database Types
// ============================================================================

export type UserRole = "admin" | "manager" | "employee";
export type CarStatus = "available" | "reserved" | "sold";
export type CarCondition = "new" | "used";
export type SaleType = "cash" | "installment";
export type SaleStatus = "pending" | "completed" | "cancelled";
export type InstallmentStatus =
  | "upcoming"
  | "paid"
  | "overdue"
  | "partially_paid";
export type PaymentMethod =
  | "cash"
  | "vodafone_cash"
  | "instapay"
  | "bank_transfer"
  | "other";
export type AttendanceType = "clock_in" | "clock_out";
export type AdjustmentType = "percentage" | "fixed";
export type AdjustmentScope = "all" | "filtered" | "single";

export interface Tenant {
  id: string;
  name: string;
  name_ar: string | null;
  slug: string;
  logo_url: string | null;
  address: string | null;
  address_ar: string | null;
  phone: string | null;
  currency: string;
  timezone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  tenant_id: string;
  role: UserRole;
  full_name: string;
  full_name_ar: string | null;
  avatar_url: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Car {
  id: string;
  tenant_id: string;
  vin: string | null;
  make: string;
  model: string;
  year: number;
  color: string | null;
  mileage_km: number;
  condition: CarCondition;
  purchase_price: number;
  market_price: number;
  currency: string;
  seller_name: string | null;
  seller_phone: string | null;
  seller_national_id: string | null;
  status: CarStatus;
  images: string[];
  notes: string | null;
  added_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  tenant_id: string;
  car_id: string;
  buyer_name: string;
  buyer_phone: string | null;
  buyer_national_id: string | null;
  buyer_address: string | null;
  sale_type: SaleType;
  sale_price: number;
  down_payment: number;
  remaining_amount: number;
  currency: string;
  status: SaleStatus;
  sold_by: string | null;
  sold_at: string;
  created_at: string;
  updated_at: string;
  // Joined
  car?: Car;
}

export interface Installment {
  id: string;
  tenant_id: string;
  sale_id: string;
  installment_number: number;
  due_date: string;
  amount_due: number;
  amount_paid: number;
  payment_method: PaymentMethod | null;
  payment_date: string | null;
  payment_reference: string | null;
  payment_screenshot_url: string | null;
  status: InstallmentStatus;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  sale?: Sale;
}

export interface Attendance {
  id: string;
  tenant_id: string;
  user_id: string;
  event_type: AttendanceType;
  timestamp: string;
  latitude: number;
  longitude: number;
  accuracy_meters: number | null;
  address_snapshot: string | null;
  device_info: string | null;
  created_at: string;
  // Joined
  profile?: Profile;
}

export interface PriceAdjustment {
  id: string;
  tenant_id: string;
  adjustment_type: AdjustmentType;
  adjustment_value: number;
  scope: AdjustmentScope;
  car_id: string | null;
  filter_make: string | null;
  filter_model: string | null;
  filter_year_min: number | null;
  filter_year_max: number | null;
  cars_affected: number;
  total_before: number | null;
  total_after: number | null;
  applied_by: string | null;
  applied_at: string;
}

// Dashboard aggregates
export interface DealershipValuation {
  tenant_id: string;
  available_count: number;
  reserved_count: number;
  sold_count: number;
  total_count: number;
  available_value: number;
  reserved_value: number;
  realized_profit: number;
  potential_profit: number;
}

export interface InstallmentSummary {
  tenant_id: string;
  buyer_name: string;
  buyer_phone: string;
  car_name: string;
  installment_number: number;
  due_date: string;
  amount_due: number;
  amount_paid: number;
  status: InstallmentStatus;
  payment_method: PaymentMethod | null;
  sale_id: string;
  installment_id: string;
}
