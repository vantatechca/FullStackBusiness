/*
  # Fix Security Issues: Indexes, RLS Policies, and Function Search Paths

  1. Indexes
    - Add covering indexes for all unindexed foreign keys on expenses, revenue, tasks

  2. RLS Policy Consolidation
    - Drop duplicate permissive policies and replace with single unified policies
    - Merge admin + department-user checks into one policy per action per table
    - Tables affected: profiles, revenue, expenses, tasks, department_notes,
      gmb_listings, influencers, suppliers, team_members

  3. Auth RLS Initialization Fix
    - Replace bare auth.uid() with (select auth.uid()) in profiles and team_members policies

  4. Helper Function Search Path Fix
    - Recreate get_user_role, get_user_departments, can_access_department
      with SET search_path = public to prevent mutable search_path vulnerability

  5. Exchange Rates Policy Restriction
    - Restrict INSERT/UPDATE on exchange_rates to admin role only
*/

-- =====================
-- 1. INDEXES FOR FOREIGN KEYS
-- =====================
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON public.expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_expenses_department_id ON public.expenses(department_id);
CREATE INDEX IF NOT EXISTS idx_revenue_created_by ON public.revenue(created_by);
CREATE INDEX IF NOT EXISTS idx_revenue_department_id ON public.revenue(department_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_department_id ON public.tasks(department_id);

-- =====================
-- 2. FIX HELPER FUNCTIONS (set search_path)
-- =====================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())),
    'member'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_departments()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT tm.departments FROM public.team_members tm
     INNER JOIN public.profiles p ON p.email = tm.email
     WHERE p.id = (SELECT auth.uid())
     LIMIT 1),
    ''
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_department(dept_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    CASE
      WHEN public.get_user_role() = 'admin' THEN true
      ELSE dept_id = ANY(string_to_array(public.get_user_departments(), ','))
    END;
$$;

-- =====================
-- 3. FIX PROFILES RLS
--    Drop old policies, replace with (select auth.uid()) and consolidated policies
-- =====================
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation on signup" ON public.profiles;

CREATE POLICY "Profiles select"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = id
    OR public.get_user_role() = 'admin'
  );

CREATE POLICY "Profiles update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    (select auth.uid()) = id
    OR public.get_user_role() = 'admin'
  )
  WITH CHECK (
    (select auth.uid()) = id
    OR public.get_user_role() = 'admin'
  );

CREATE POLICY "Profiles insert on signup"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

-- =====================
-- 4. FIX REVENUE RLS
-- =====================
DROP POLICY IF EXISTS "Admins read all revenue" ON public.revenue;
DROP POLICY IF EXISTS "Dept users read revenue" ON public.revenue;
DROP POLICY IF EXISTS "Admins insert revenue" ON public.revenue;
DROP POLICY IF EXISTS "Dept users insert revenue" ON public.revenue;
DROP POLICY IF EXISTS "Admins update revenue" ON public.revenue;
DROP POLICY IF EXISTS "Dept users update revenue" ON public.revenue;
DROP POLICY IF EXISTS "Admins delete revenue" ON public.revenue;
DROP POLICY IF EXISTS "Dept users delete revenue" ON public.revenue;

CREATE POLICY "Revenue select"
  ON public.revenue FOR SELECT TO authenticated
  USING (public.can_access_department(department_id));

CREATE POLICY "Revenue insert"
  ON public.revenue FOR INSERT TO authenticated
  WITH CHECK (public.can_access_department(department_id));

CREATE POLICY "Revenue update"
  ON public.revenue FOR UPDATE TO authenticated
  USING (public.can_access_department(department_id))
  WITH CHECK (public.can_access_department(department_id));

CREATE POLICY "Revenue delete"
  ON public.revenue FOR DELETE TO authenticated
  USING (public.can_access_department(department_id));

-- =====================
-- 5. FIX EXPENSES RLS
-- =====================
DROP POLICY IF EXISTS "Admins read all expenses" ON public.expenses;
DROP POLICY IF EXISTS "Dept users read expenses" ON public.expenses;
DROP POLICY IF EXISTS "Admins insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Dept users insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Admins update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Dept users update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Admins delete expenses" ON public.expenses;
DROP POLICY IF EXISTS "Dept users delete expenses" ON public.expenses;

CREATE POLICY "Expenses select"
  ON public.expenses FOR SELECT TO authenticated
  USING (public.can_access_department(department_id));

CREATE POLICY "Expenses insert"
  ON public.expenses FOR INSERT TO authenticated
  WITH CHECK (public.can_access_department(department_id));

CREATE POLICY "Expenses update"
  ON public.expenses FOR UPDATE TO authenticated
  USING (public.can_access_department(department_id))
  WITH CHECK (public.can_access_department(department_id));

CREATE POLICY "Expenses delete"
  ON public.expenses FOR DELETE TO authenticated
  USING (public.can_access_department(department_id));

-- =====================
-- 6. FIX TASKS RLS
-- =====================
DROP POLICY IF EXISTS "Admins read all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Dept users read tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Dept users insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Dept users update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins delete tasks" ON public.tasks;
DROP POLICY IF EXISTS "Dept users delete tasks" ON public.tasks;

CREATE POLICY "Tasks select"
  ON public.tasks FOR SELECT TO authenticated
  USING (public.can_access_department(department_id));

CREATE POLICY "Tasks insert"
  ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (public.can_access_department(department_id));

CREATE POLICY "Tasks update"
  ON public.tasks FOR UPDATE TO authenticated
  USING (public.can_access_department(department_id))
  WITH CHECK (public.can_access_department(department_id));

CREATE POLICY "Tasks delete"
  ON public.tasks FOR DELETE TO authenticated
  USING (public.can_access_department(department_id));

-- =====================
-- 7. FIX DEPARTMENT NOTES RLS
-- =====================
DROP POLICY IF EXISTS "Admins read all dept notes" ON public.department_notes;
DROP POLICY IF EXISTS "Dept users read notes" ON public.department_notes;
DROP POLICY IF EXISTS "Admins insert dept notes" ON public.department_notes;
DROP POLICY IF EXISTS "Dept users insert notes" ON public.department_notes;
DROP POLICY IF EXISTS "Admins update dept notes" ON public.department_notes;
DROP POLICY IF EXISTS "Dept users update notes" ON public.department_notes;

CREATE POLICY "Dept notes select"
  ON public.department_notes FOR SELECT TO authenticated
  USING (public.can_access_department(department_id));

CREATE POLICY "Dept notes insert"
  ON public.department_notes FOR INSERT TO authenticated
  WITH CHECK (public.can_access_department(department_id));

CREATE POLICY "Dept notes update"
  ON public.department_notes FOR UPDATE TO authenticated
  USING (public.can_access_department(department_id))
  WITH CHECK (public.can_access_department(department_id));

-- =====================
-- 8. FIX GMB LISTINGS RLS
-- =====================
DROP POLICY IF EXISTS "Admins read all gmb" ON public.gmb_listings;
DROP POLICY IF EXISTS "GMB users read listings" ON public.gmb_listings;
DROP POLICY IF EXISTS "Admins insert gmb" ON public.gmb_listings;
DROP POLICY IF EXISTS "GMB users insert listings" ON public.gmb_listings;
DROP POLICY IF EXISTS "Admins update gmb" ON public.gmb_listings;
DROP POLICY IF EXISTS "GMB users update listings" ON public.gmb_listings;
DROP POLICY IF EXISTS "Admins delete gmb" ON public.gmb_listings;
DROP POLICY IF EXISTS "GMB users delete listings" ON public.gmb_listings;

CREATE POLICY "GMB listings select"
  ON public.gmb_listings FOR SELECT TO authenticated
  USING (public.can_access_department('google-my-business'));

CREATE POLICY "GMB listings insert"
  ON public.gmb_listings FOR INSERT TO authenticated
  WITH CHECK (public.can_access_department('google-my-business'));

CREATE POLICY "GMB listings update"
  ON public.gmb_listings FOR UPDATE TO authenticated
  USING (public.can_access_department('google-my-business'))
  WITH CHECK (public.can_access_department('google-my-business'));

CREATE POLICY "GMB listings delete"
  ON public.gmb_listings FOR DELETE TO authenticated
  USING (public.can_access_department('google-my-business'));

-- =====================
-- 9. FIX INFLUENCERS RLS
-- =====================
DROP POLICY IF EXISTS "Admins read all influencers" ON public.influencers;
DROP POLICY IF EXISTS "Influencer dept users read" ON public.influencers;
DROP POLICY IF EXISTS "Admins insert influencers" ON public.influencers;
DROP POLICY IF EXISTS "Influencer dept users insert" ON public.influencers;
DROP POLICY IF EXISTS "Admins update influencers" ON public.influencers;
DROP POLICY IF EXISTS "Influencer dept users update" ON public.influencers;
DROP POLICY IF EXISTS "Admins delete influencers" ON public.influencers;
DROP POLICY IF EXISTS "Influencer dept users delete" ON public.influencers;

CREATE POLICY "Influencers select"
  ON public.influencers FOR SELECT TO authenticated
  USING (public.can_access_department('influencers-promos'));

CREATE POLICY "Influencers insert"
  ON public.influencers FOR INSERT TO authenticated
  WITH CHECK (public.can_access_department('influencers-promos'));

CREATE POLICY "Influencers update"
  ON public.influencers FOR UPDATE TO authenticated
  USING (public.can_access_department('influencers-promos'))
  WITH CHECK (public.can_access_department('influencers-promos'));

CREATE POLICY "Influencers delete"
  ON public.influencers FOR DELETE TO authenticated
  USING (public.can_access_department('influencers-promos'));

-- =====================
-- 10. FIX SUPPLIERS RLS
-- =====================
DROP POLICY IF EXISTS "Admins read all suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Restock dept users read suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Admins insert suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Restock dept users insert suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Admins update suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Restock dept users update suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Admins delete suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Restock dept users delete suppliers" ON public.suppliers;

CREATE POLICY "Suppliers select"
  ON public.suppliers FOR SELECT TO authenticated
  USING (public.can_access_department('restock-suppliers'));

CREATE POLICY "Suppliers insert"
  ON public.suppliers FOR INSERT TO authenticated
  WITH CHECK (public.can_access_department('restock-suppliers'));

CREATE POLICY "Suppliers update"
  ON public.suppliers FOR UPDATE TO authenticated
  USING (public.can_access_department('restock-suppliers'))
  WITH CHECK (public.can_access_department('restock-suppliers'));

CREATE POLICY "Suppliers delete"
  ON public.suppliers FOR DELETE TO authenticated
  USING (public.can_access_department('restock-suppliers'));

-- =====================
-- 11. FIX TEAM MEMBERS RLS
-- =====================
DROP POLICY IF EXISTS "Admins read all team members" ON public.team_members;
DROP POLICY IF EXISTS "Users read own team record" ON public.team_members;

CREATE POLICY "Team members select"
  ON public.team_members FOR SELECT TO authenticated
  USING (
    public.get_user_role() = 'admin'
    OR email = (SELECT p.email FROM public.profiles p WHERE p.id = (SELECT auth.uid()))
  );

-- =====================
-- 12. FIX EXCHANGE RATES RLS
--     Restrict write operations to admin role only
-- =====================
DROP POLICY IF EXISTS "Auth users upsert exchange rates" ON public.exchange_rates;
DROP POLICY IF EXISTS "Auth users update exchange rates" ON public.exchange_rates;

CREATE POLICY "Admin upsert exchange rates"
  ON public.exchange_rates FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Admin update exchange rates"
  ON public.exchange_rates FOR UPDATE TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');
