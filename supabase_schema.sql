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
  "entryDate" TEXT NOT NULL,  -- Kept as text to match application logic, or change to DATE
  mode TEXT NOT NULL CHECK (mode IN ('daily', 'monthly')),
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
-- Users can read all users (or restrict this as needed)
CREATE POLICY "Enable read access for all authenticated users" ON public.users
  FOR SELECT TO authenticated USING (true);

-- Users can read entries
CREATE POLICY "Enable read access for all authenticated users" ON public.entries
  FOR SELECT TO authenticated USING (true);

-- Authenticated users can insert entries
CREATE POLICY "Enable insert access for authenticated users" ON public.entries
  FOR INSERT TO authenticated WITH CHECK (true);

-- Allow inserting into accessRequests for unauthenticated users (since they sign up and get rejected initially)
CREATE POLICY "Enable insert for access Requests" ON public."accessRequests"
  FOR INSERT TO anon, authenticated WITH CHECK (true);
