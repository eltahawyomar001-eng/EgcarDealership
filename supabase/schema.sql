-- ============================================================================
-- CarOS Egypt — Multi-Tenant SaaS Database Schema
-- Supabase (PostgreSQL) with Row Level Security
-- ============================================================================

-- ============================================================================
-- 0. Extensions
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TENANTS — Each dealership is an isolated tenant
-- ============================================================================
CREATE TABLE public.tenants (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  name_ar       TEXT, -- Arabic name
  slug          TEXT UNIQUE NOT NULL, -- URL-safe identifier
  logo_url      TEXT,
  address       TEXT,
  address_ar    TEXT,
  phone         TEXT,
  currency      TEXT NOT NULL DEFAULT 'EGP',
  timezone      TEXT NOT NULL DEFAULT 'Africa/Cairo',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. PROFILES — Users linked to auth.users with Role + Tenant
-- ============================================================================
CREATE TYPE public.user_role AS ENUM ('admin', 'employee');

CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role          public.user_role NOT NULL DEFAULT 'employee',
  full_name     TEXT NOT NULL,
  full_name_ar  TEXT,
  avatar_url    TEXT,
  phone         TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast tenant-scoped queries
CREATE INDEX idx_profiles_tenant ON public.profiles(tenant_id);

-- ============================================================================
-- 3. CARS — Inventory with Pegged vs Market pricing
-- ============================================================================
CREATE TYPE public.car_status AS ENUM ('available', 'reserved', 'sold');
CREATE TYPE public.car_condition AS ENUM ('new', 'used');

CREATE TABLE public.cars (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

  -- Vehicle identification
  vin             TEXT,
  make            TEXT NOT NULL,           -- e.g. "Toyota"
  model           TEXT NOT NULL,           -- e.g. "Corolla"
  year            INT NOT NULL,
  color           TEXT,
  mileage_km      INT DEFAULT 0,
  condition       public.car_condition NOT NULL DEFAULT 'used',

  -- Pricing
  purchase_price  NUMERIC(12,2) NOT NULL,   -- What dealership paid (pegged/cost)
  market_price    NUMERIC(12,2) NOT NULL,    -- Current asking price (market)
  currency        TEXT NOT NULL DEFAULT 'EGP',

  -- Seller info (who sold TO the dealership)
  seller_name     TEXT,
  seller_phone    TEXT,
  seller_national_id TEXT,

  -- Status
  status          public.car_status NOT NULL DEFAULT 'available',

  -- Media
  images          TEXT[] DEFAULT '{}',       -- Array of image URLs
  notes           TEXT,

  -- Metadata
  added_by        UUID REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cars_tenant ON public.cars(tenant_id);
CREATE INDEX idx_cars_status ON public.cars(tenant_id, status);

-- ============================================================================
-- 4. SALES — Tracks car sales (Cash or Installment)
-- ============================================================================
CREATE TYPE public.sale_type AS ENUM ('cash', 'installment');
CREATE TYPE public.sale_status AS ENUM ('pending', 'completed', 'cancelled');

CREATE TABLE public.sales (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  car_id          UUID NOT NULL REFERENCES public.cars(id) ON DELETE RESTRICT,

  -- Buyer info
  buyer_name      TEXT NOT NULL,
  buyer_phone     TEXT,
  buyer_national_id TEXT,
  buyer_address   TEXT,

  -- Sale details
  sale_type       public.sale_type NOT NULL DEFAULT 'cash',
  sale_price      NUMERIC(12,2) NOT NULL,    -- Final agreed price
  down_payment    NUMERIC(12,2) DEFAULT 0,   -- For installment sales
  remaining_amount NUMERIC(12,2) DEFAULT 0,  -- sale_price - down_payment
  currency        TEXT NOT NULL DEFAULT 'EGP',

  -- Status
  status          public.sale_status NOT NULL DEFAULT 'pending',

  -- Metadata
  sold_by         UUID REFERENCES public.profiles(id),
  sold_at         TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sales_tenant ON public.sales(tenant_id);
CREATE INDEX idx_sales_car ON public.sales(car_id);

-- ============================================================================
-- 5. INSTALLMENTS — Payment schedules for installment sales (Daf'aat)
-- ============================================================================
CREATE TYPE public.installment_status AS ENUM ('upcoming', 'paid', 'overdue', 'partially_paid');
CREATE TYPE public.payment_method AS ENUM ('cash', 'vodafone_cash', 'instapay', 'bank_transfer', 'other');

CREATE TABLE public.installments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sale_id         UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,

  -- Schedule
  installment_number INT NOT NULL,
  due_date        DATE NOT NULL,
  amount_due      NUMERIC(12,2) NOT NULL,
  amount_paid     NUMERIC(12,2) NOT NULL DEFAULT 0,

  -- Payment info
  payment_method  public.payment_method,
  payment_date    TIMESTAMPTZ,
  payment_reference TEXT,              -- Transaction ID / reference number
  payment_screenshot_url TEXT,         -- Uploaded proof of payment

  -- Status
  status          public.installment_status NOT NULL DEFAULT 'upcoming',

  -- Notes
  notes           TEXT,

  -- Metadata
  recorded_by     UUID REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_installments_tenant ON public.installments(tenant_id);
CREATE INDEX idx_installments_sale ON public.installments(sale_id);
CREATE INDEX idx_installments_due ON public.installments(tenant_id, due_date, status);

-- ============================================================================
-- 6. ATTENDANCE — GPS-gated clock-in/out events
-- ============================================================================
CREATE TYPE public.attendance_type AS ENUM ('clock_in', 'clock_out');

CREATE TABLE public.attendance (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Event
  event_type      public.attendance_type NOT NULL DEFAULT 'clock_in',
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- GPS — Required for clock_in
  latitude        DOUBLE PRECISION NOT NULL,
  longitude       DOUBLE PRECISION NOT NULL,
  accuracy_meters DOUBLE PRECISION,        -- GPS accuracy in meters
  address_snapshot TEXT,                    -- Reverse-geocoded address at capture time

  -- Metadata
  device_info     TEXT,                    -- User-agent or device identifier
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attendance_tenant ON public.attendance(tenant_id);
CREATE INDEX idx_attendance_user ON public.attendance(user_id, timestamp DESC);

-- ============================================================================
-- 7. PRICE ADJUSTMENT LOG — Audit trail for inflation adjustments
-- ============================================================================
CREATE TYPE public.adjustment_type AS ENUM ('percentage', 'fixed');
CREATE TYPE public.adjustment_scope AS ENUM ('all', 'filtered', 'single');

CREATE TABLE public.price_adjustments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

  -- Adjustment details
  adjustment_type public.adjustment_type NOT NULL,
  adjustment_value NUMERIC(12,2) NOT NULL,   -- e.g. 5.00 for 5% or 10000 for 10,000 EGP
  scope           public.adjustment_scope NOT NULL DEFAULT 'all',
  car_id          UUID REFERENCES public.cars(id),  -- Only for 'single' scope

  -- Filter criteria (for 'filtered' scope)
  filter_make     TEXT,
  filter_model    TEXT,
  filter_year_min INT,
  filter_year_max INT,

  -- Results
  cars_affected   INT NOT NULL DEFAULT 0,
  total_before    NUMERIC(14,2),
  total_after     NUMERIC(14,2),

  -- Metadata
  applied_by      UUID REFERENCES public.profiles(id),
  applied_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_price_adjustments_tenant ON public.price_adjustments(tenant_id);

-- ============================================================================
-- 8. HELPER FUNCTION — Get current user's tenant_id
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- 9. HELPER FUNCTION — Check if current user is admin
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- 10. AUTO-UPDATE TIMESTAMPS — Trigger function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.cars
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.installments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 11. AUTO-UPDATE INSTALLMENT STATUS — Mark overdue installments
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_overdue_installments()
RETURNS void AS $$
  UPDATE public.installments
  SET status = 'overdue', updated_at = NOW()
  WHERE status = 'upcoming'
    AND due_date < CURRENT_DATE;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================================
-- 12. AUTO-CREATE PROFILE — When a new user signs up
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, tenant_id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(
      (NEW.raw_user_meta_data->>'tenant_id')::UUID,
      (SELECT id FROM public.tenants LIMIT 1) -- Fallback for dev
    ),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'employee')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 13. ROW LEVEL SECURITY — Enable on all tables
-- ============================================================================
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_adjustments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 14. RLS POLICIES — Tenant Isolation
-- ============================================================================

-- ── TENANTS ─────────────────────────────────────────────────────────────────
-- Users can only see their own tenant
CREATE POLICY "Users can view own tenant"
  ON public.tenants FOR SELECT
  USING (id = public.get_user_tenant_id());

-- Only admins can update their tenant
CREATE POLICY "Admins can update own tenant"
  ON public.tenants FOR UPDATE
  USING (id = public.get_user_tenant_id() AND public.is_admin())
  WITH CHECK (id = public.get_user_tenant_id() AND public.is_admin());

-- ── PROFILES ────────────────────────────────────────────────────────────────
-- Users can see all profiles in their tenant
CREATE POLICY "Users can view tenant profiles"
  ON public.profiles FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admins can update any profile in their tenant
CREATE POLICY "Admins can update tenant profiles"
  ON public.profiles FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id() AND public.is_admin())
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.is_admin());

-- Admins can insert profiles in their tenant
CREATE POLICY "Admins can insert tenant profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.is_admin());

-- Service role can insert profiles (for triggers)
CREATE POLICY "Service can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (TRUE);

-- ── CARS ────────────────────────────────────────────────────────────────────
-- All tenant members can view cars
CREATE POLICY "Users can view tenant cars"
  ON public.cars FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

-- All tenant members can add cars
CREATE POLICY "Users can insert tenant cars"
  ON public.cars FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id());

-- All tenant members can update cars
CREATE POLICY "Users can update tenant cars"
  ON public.cars FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (tenant_id = public.get_user_tenant_id());

-- Only admins can delete cars
CREATE POLICY "Admins can delete tenant cars"
  ON public.cars FOR DELETE
  USING (tenant_id = public.get_user_tenant_id() AND public.is_admin());

-- ── SALES ───────────────────────────────────────────────────────────────────
CREATE POLICY "Users can view tenant sales"
  ON public.sales FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can insert tenant sales"
  ON public.sales FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update tenant sales"
  ON public.sales FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Admins can delete tenant sales"
  ON public.sales FOR DELETE
  USING (tenant_id = public.get_user_tenant_id() AND public.is_admin());

-- ── INSTALLMENTS ────────────────────────────────────────────────────────────
CREATE POLICY "Users can view tenant installments"
  ON public.installments FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can insert tenant installments"
  ON public.installments FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update tenant installments"
  ON public.installments FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Admins can delete tenant installments"
  ON public.installments FOR DELETE
  USING (tenant_id = public.get_user_tenant_id() AND public.is_admin());

-- ── ATTENDANCE ──────────────────────────────────────────────────────────────
-- Users can see all attendance in their tenant
CREATE POLICY "Users can view tenant attendance"
  ON public.attendance FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

-- Users can only insert their own attendance
CREATE POLICY "Users can insert own attendance"
  ON public.attendance FOR INSERT
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND user_id = auth.uid()
  );

-- No one can update or delete attendance (immutable audit log)
-- (No UPDATE or DELETE policies = blocked by RLS)

-- ── PRICE ADJUSTMENTS ──────────────────────────────────────────────────────
-- All tenant members can view adjustments
CREATE POLICY "Users can view tenant price adjustments"
  ON public.price_adjustments FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

-- Only admins can create price adjustments
CREATE POLICY "Admins can insert price adjustments"
  ON public.price_adjustments FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.is_admin());

-- ============================================================================
-- 15. VIEWS — Convenience views for dashboards
-- ============================================================================

-- Dealership valuation: total market value of available inventory
CREATE OR REPLACE VIEW public.v_dealership_valuation AS
SELECT
  tenant_id,
  COUNT(*) FILTER (WHERE status = 'available') AS available_count,
  COUNT(*) FILTER (WHERE status = 'reserved') AS reserved_count,
  COUNT(*) FILTER (WHERE status = 'sold') AS sold_count,
  COUNT(*) AS total_count,
  COALESCE(SUM(market_price) FILTER (WHERE status = 'available'), 0) AS available_value,
  COALESCE(SUM(market_price) FILTER (WHERE status = 'reserved'), 0) AS reserved_value,
  COALESCE(SUM(market_price - purchase_price) FILTER (WHERE status = 'sold'), 0) AS realized_profit,
  COALESCE(SUM(market_price - purchase_price) FILTER (WHERE status = 'available'), 0) AS potential_profit
FROM public.cars
GROUP BY tenant_id;

-- Upcoming/overdue installments summary
CREATE OR REPLACE VIEW public.v_installment_summary AS
SELECT
  i.tenant_id,
  s.buyer_name,
  s.buyer_phone,
  c.make || ' ' || c.model || ' ' || c.year AS car_name,
  i.installment_number,
  i.due_date,
  i.amount_due,
  i.amount_paid,
  i.status,
  i.payment_method,
  i.sale_id,
  i.id AS installment_id
FROM public.installments i
JOIN public.sales s ON i.sale_id = s.id
JOIN public.cars c ON s.car_id = c.id
ORDER BY i.due_date ASC;

-- Today's attendance
CREATE OR REPLACE VIEW public.v_today_attendance AS
SELECT
  a.tenant_id,
  a.user_id,
  p.full_name,
  p.full_name_ar,
  a.event_type,
  a.timestamp,
  a.latitude,
  a.longitude,
  a.accuracy_meters,
  a.address_snapshot
FROM public.attendance a
JOIN public.profiles p ON a.user_id = p.id
WHERE a.timestamp::date = CURRENT_DATE
ORDER BY a.timestamp DESC;

-- ============================================================================
-- 16. STORAGE BUCKETS — For payment screenshots & car images
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('car-images', 'car-images', true),
  ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: car images are public read, tenant-scoped write
CREATE POLICY "Public can view car images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'car-images');

CREATE POLICY "Authenticated users can upload car images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'car-images' AND auth.role() = 'authenticated');

-- Storage RLS: payment proofs are tenant-scoped
CREATE POLICY "Authenticated users can view payment proofs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-proofs' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload payment proofs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'payment-proofs' AND auth.role() = 'authenticated');

-- ============================================================================
-- 17. SEED DATA — Demo tenant for development
-- ============================================================================
-- Uncomment to seed:
-- INSERT INTO public.tenants (name, name_ar, slug, phone)
-- VALUES ('Demo Dealership', 'معرض تجريبي', 'demo', '+201000000000');
