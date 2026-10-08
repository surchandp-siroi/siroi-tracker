-- Ensure RLS is enabled on org_nodes
ALTER TABLE public.org_nodes ENABLE ROW LEVEL SECURITY;

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Enable insert for admins only" ON public.org_nodes;
DROP POLICY IF EXISTS "Enable update for admins only" ON public.org_nodes;
DROP POLICY IF EXISTS "Enable delete for admins only" ON public.org_nodes;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.org_nodes;
DROP POLICY IF EXISTS "Enable read access for anon users" ON public.org_nodes;
DROP POLICY IF EXISTS "Enable read access for all" ON public.org_nodes;
DROP POLICY IF EXISTS "Enable insert for admins" ON public.org_nodes;
DROP POLICY IF EXISTS "Enable update for admins" ON public.org_nodes;
DROP POLICY IF EXISTS "Enable delete for admins" ON public.org_nodes;

-- 1. Read: Everyone can read the organization chart
CREATE POLICY "Enable read access for all"
ON public.org_nodes
FOR SELECT
TO public
USING (true);

-- 2. Insert: Authenticated admins can add employees
CREATE POLICY "Enable insert for admins"
ON public.org_nodes
FOR INSERT
TO public
WITH CHECK (
  get_user_role() = 'admin'
  OR (current_setting('request.jwt.claims', true)::json ->> 'email') = ANY (ARRAY[
    'surchanddsingh@siroiforex.com',
    'sharjuthoudam@siroiforex.com',
    'executive@siroiforex.com',
    'tomas@siroiforex.com'
  ])
  OR (auth.jwt() ->> 'email') = ANY (ARRAY[
    'surchanddsingh@siroiforex.com',
    'sharjuthoudam@siroiforex.com',
    'executive@siroiforex.com',
    'tomas@siroiforex.com'
  ])
  OR EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- 3. Update: Authenticated admins can edit employees
CREATE POLICY "Enable update for admins"
ON public.org_nodes
FOR UPDATE
TO public
USING (
  get_user_role() = 'admin'
  OR (current_setting('request.jwt.claims', true)::json ->> 'email') = ANY (ARRAY[
    'surchanddsingh@siroiforex.com',
    'sharjuthoudam@siroiforex.com',
    'executive@siroiforex.com',
    'tomas@siroiforex.com'
  ])
  OR (auth.jwt() ->> 'email') = ANY (ARRAY[
    'surchanddsingh@siroiforex.com',
    'sharjuthoudam@siroiforex.com',
    'executive@siroiforex.com',
    'tomas@siroiforex.com'
  ])
  OR EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
)
WITH CHECK (
  get_user_role() = 'admin'
  OR (current_setting('request.jwt.claims', true)::json ->> 'email') = ANY (ARRAY[
    'surchanddsingh@siroiforex.com',
    'sharjuthoudam@siroiforex.com',
    'executive@siroiforex.com',
    'tomas@siroiforex.com'
  ])
  OR (auth.jwt() ->> 'email') = ANY (ARRAY[
    'surchanddsingh@siroiforex.com',
    'sharjuthoudam@siroiforex.com',
    'executive@siroiforex.com',
    'tomas@siroiforex.com'
  ])
  OR EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- 4. Delete: Authenticated admins can delete employees
CREATE POLICY "Enable delete for admins"
ON public.org_nodes
FOR DELETE
TO public
USING (
  get_user_role() = 'admin'
  OR (current_setting('request.jwt.claims', true)::json ->> 'email') = ANY (ARRAY[
    'surchanddsingh@siroiforex.com',
    'sharjuthoudam@siroiforex.com',
    'executive@siroiforex.com',
    'tomas@siroiforex.com'
  ])
  OR (auth.jwt() ->> 'email') = ANY (ARRAY[
    'surchanddsingh@siroiforex.com',
    'sharjuthoudam@siroiforex.com',
    'executive@siroiforex.com',
    'tomas@siroiforex.com'
  ])
  OR EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);
