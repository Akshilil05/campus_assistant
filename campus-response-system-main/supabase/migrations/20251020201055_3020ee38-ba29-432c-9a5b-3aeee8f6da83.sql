 -- Enums
CREATE TYPE public.user_role AS ENUM ('student', 'staff');
CREATE TYPE public.alert_type AS ENUM ('high', 'moderate', 'general');

-- Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL,
  full_name TEXT NOT NULL,
  student_id TEXT,
  staff_id TEXT,
  department TEXT NOT NULL,
  year INTEGER,
  phone_number TEXT,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ADD CONSTRAINT student_has_student_id 
  CHECK (role != 'student' OR student_id IS NOT NULL);
ALTER TABLE public.profiles ADD CONSTRAINT staff_has_staff_id 
  CHECK (role != 'staff' OR staff_id IS NOT NULL);
ALTER TABLE public.profiles ADD CONSTRAINT student_has_year 
  CHECK (role != 'student' OR year IS NOT NULL);

-- Alerts Table
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  alert_type public.alert_type NOT NULL,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  description TEXT,
  department TEXT,
  year TEXT,
  student_unique_id TEXT,
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending'
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Alerts Policies
CREATE POLICY "Students can insert their own alerts"
  ON public.alerts FOR INSERT
  WITH CHECK (
    student_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'student'
    )
  );

CREATE POLICY "Students can view their own alerts"
  ON public.alerts FOR SELECT
  USING (
    student_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'student'
    )
  );

CREATE POLICY "Staff can view all alerts"
  ON public.alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'staff'
    )
  );

CREATE POLICY "Staff can view student profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'staff'
    )
  );

-- Auto-updated timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_alerts_student_id ON public.alerts(student_id);
CREATE INDEX IF NOT EXISTS idx_alerts_alert_type ON public.alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON public.alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
