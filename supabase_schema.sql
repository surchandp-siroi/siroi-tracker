-- Run this in your Supabase SQL Editor to set up the tables for your application.

-- 1. Create Users Table
CREATE TABLE public.users (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'statehead')),
  "branchId" TEXT,
  "latestLocation" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Entries Table
CREATE TABLE public.entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "branchId" TEXT NOT NULL,
  "entryDate" TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('daily', 'monthly')),
  "recordType" TEXT NOT NULL DEFAULT 'achievement' CHECK ("recordType" IN ('projection', 'achievement')),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  "totalAmount" NUMERIC NOT NULL DEFAULT 0,
  "authorId" UUID REFERENCES auth.users NOT NULL,
  "authorEmail" TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Access Requests Table
CREATE TABLE public."accessRequests" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  location TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."accessRequests" ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "Enable read access for all authenticated users" ON public.users
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for all authenticated users" ON public.entries
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON public.entries
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable insert for access Requests" ON public."accessRequests"
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Admin update access" ON public.entries
  FOR UPDATE TO public USING (get_user_role() = 'admin'::text) WITH CHECK (get_user_role() = 'admin'::text);

-- 6. Create Upload Audit Logs Table
CREATE TABLE public.upload_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  email_id TEXT NOT NULL,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Create Consultants Table
CREATE TABLE public.consultants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    pan_number TEXT NOT NULL,
    pan_file_url TEXT,
    aadhar_number TEXT NOT NULL,
    aadhar_file_url TEXT,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_type TEXT NOT NULL,
    ifsc_code TEXT NOT NULL,
    address TEXT NOT NULL,
    pincode TEXT NOT NULL,
    state TEXT NOT NULL,
    city TEXT NOT NULL,
    current_workspace TEXT NOT NULL,
    associated_branch TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.consultants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable insert for consultants" ON public.consultants
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Enable read access for all authenticated users" ON public.consultants
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin update access" ON public.consultants
  FOR UPDATE TO public USING (get_user_role() = 'admin'::text) WITH CHECK (get_user_role() = 'admin'::text);

-- 8. Create Customer Data Table
CREATE TABLE public.customer_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name TEXT,
    customer_type TEXT,
    pan_number TEXT NOT NULL,
    aadhar_number TEXT,
    association_date TEXT,
    address TEXT,
    pincode TEXT,
    city TEXT,
    district TEXT,
    phone_number TEXT,
    email_id TEXT,
    income_type TEXT,
    yearly_income_range TEXT,
    birthday DATE,
    anniversary DATE,
    company_name TEXT,
    category TEXT,
    product TEXT,
    amount NUMERIC,
    entry_person_name TEXT NOT NULL,
    entry_location TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Loan KYC & Extended Details
    father_name TEXT,
    mother_name TEXT,
    marital_status TEXT,
    spouse_name TEXT,
    education_qualification TEXT,
    designation TEXT,
    official_email TEXT,
    office_phone TEXT,
    office_address TEXT,
    office_landmark TEXT,
    residence_type TEXT,
    current_address_landmark TEXT,
    years_in_current_residence TEXT,
    years_in_current_city TEXT,
    permanent_address TEXT,
    permanent_address_landmark TEXT,
    permanent_phone TEXT,
    salary_bank_name TEXT,
    salary_account_number TEXT,
    tenure TEXT,
    ref1_name TEXT,
    ref1_phone TEXT,
    ref1_address TEXT,
    ref1_relation TEXT,
    ref2_name TEXT,
    ref2_phone TEXT,
    ref2_address TEXT,
    ref2_relation TEXT,
    loan_eligibility JSONB
);

ALTER TABLE public.customer_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable insert for customer_data" ON public.customer_data
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Enable select for customer_data" ON public.customer_data
  FOR SELECT TO public USING (true);
