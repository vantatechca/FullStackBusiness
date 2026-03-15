/*
  # Business Hub - RLS Policies and Helper Functions

  1. Helper Functions
    - `get_user_role()` - Returns the authenticated user's role from profiles
    - `get_user_departments()` - Returns comma-separated department IDs assigned to user
    - `can_access_department(dept_id)` - Checks if user has access to a specific department

  2. Security Policies
    - Profiles: users read/update own, admins read/update all
    - Departments: all authenticated users can read
    - Revenue/Expenses/Tasks/Notes: admin full access, others by department assignment
    - GMB/Influencers/Suppliers: admin full access, others by specific department check
    - Team Members: admin full CRUD, users read own record
    - Exchange Rates: all authenticated users can read/write (cache)
*/

-- Helper function: get user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    'member'
  );
$$;

-- Helper function: get user departments
CREATE OR REPLACE FUNCTION public.get_user_departments()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT tm.departments FROM public.team_members tm
     INNER JOIN public.profiles p ON p.email = tm.email
     WHERE p.id = auth.uid()
     LIMIT 1),
    ''
  );
$$;

-- Helper function: check department access
CREATE OR REPLACE FUNCTION public.can_access_department(dept_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    CASE
      WHEN public.get_user_role() = 'admin' THEN true
      ELSE dept_id = ANY(string_to_array(public.get_user_departments(), ','))
    END;
$$;

-- =====================
-- PROFILES RLS
-- =====================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Allow profile creation on signup"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- =====================
-- DEPARTMENTS RLS
-- =====================
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can read departments"
  ON public.departments FOR SELECT
  TO authenticated
  USING (true);

-- =====================
-- REVENUE RLS
-- =====================
ALTER TABLE public.revenue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all revenue"
  ON public.revenue FOR SELECT TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Dept users read revenue"
  ON public.revenue FOR SELECT TO authenticated
  USING (public.can_access_department(department_id));

CREATE POLICY "Admins insert revenue"
  ON public.revenue FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Dept users insert revenue"
  ON public.revenue FOR INSERT TO authenticated
  WITH CHECK (public.can_access_department(department_id));

CREATE POLICY "Admins update revenue"
  ON public.revenue FOR UPDATE TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Dept users update revenue"
  ON public.revenue FOR UPDATE TO authenticated
  USING (public.can_access_department(department_id))
  WITH CHECK (public.can_access_department(department_id));

CREATE POLICY "Admins delete revenue"
  ON public.revenue FOR DELETE TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Dept users delete revenue"
  ON public.revenue FOR DELETE TO authenticated
  USING (public.can_access_department(department_id));

-- =====================
-- EXPENSES RLS
-- =====================
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all expenses"
  ON public.expenses FOR SELECT TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Dept users read expenses"
  ON public.expenses FOR SELECT TO authenticated
  USING (public.can_access_department(department_id));

CREATE POLICY "Admins insert expenses"
  ON public.expenses FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Dept users insert expenses"
  ON public.expenses FOR INSERT TO authenticated
  WITH CHECK (public.can_access_department(department_id));

CREATE POLICY "Admins update expenses"
  ON public.expenses FOR UPDATE TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Dept users update expenses"
  ON public.expenses FOR UPDATE TO authenticated
  USING (public.can_access_department(department_id))
  WITH CHECK (public.can_access_department(department_id));

CREATE POLICY "Admins delete expenses"
  ON public.expenses FOR DELETE TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Dept users delete expenses"
  ON public.expenses FOR DELETE TO authenticated
  USING (public.can_access_department(department_id));

-- =====================
-- TASKS RLS
-- =====================
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all tasks"
  ON public.tasks FOR SELECT TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Dept users read tasks"
  ON public.tasks FOR SELECT TO authenticated
  USING (public.can_access_department(department_id));

CREATE POLICY "Admins insert tasks"
  ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Dept users insert tasks"
  ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (public.can_access_department(department_id));

CREATE POLICY "Admins update tasks"
  ON public.tasks FOR UPDATE TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Dept users update tasks"
  ON public.tasks FOR UPDATE TO authenticated
  USING (public.can_access_department(department_id))
  WITH CHECK (public.can_access_department(department_id));

CREATE POLICY "Admins delete tasks"
  ON public.tasks FOR DELETE TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Dept users delete tasks"
  ON public.tasks FOR DELETE TO authenticated
  USING (public.can_access_department(department_id));

-- =====================
-- DEPARTMENT NOTES RLS
-- =====================
ALTER TABLE public.department_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all dept notes"
  ON public.department_notes FOR SELECT TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Dept users read notes"
  ON public.department_notes FOR SELECT TO authenticated
  USING (public.can_access_department(department_id));

CREATE POLICY "Admins insert dept notes"
  ON public.department_notes FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Dept users insert notes"
  ON public.department_notes FOR INSERT TO authenticated
  WITH CHECK (public.can_access_department(department_id));

CREATE POLICY "Admins update dept notes"
  ON public.department_notes FOR UPDATE TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Dept users update notes"
  ON public.department_notes FOR UPDATE TO authenticated
  USING (public.can_access_department(department_id))
  WITH CHECK (public.can_access_department(department_id));

-- =====================
-- GMB LISTINGS RLS
-- =====================
ALTER TABLE public.gmb_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all gmb"
  ON public.gmb_listings FOR SELECT TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY "GMB users read listings"
  ON public.gmb_listings FOR SELECT TO authenticated
  USING (public.can_access_department('google-my-business'));

CREATE POLICY "Admins insert gmb"
  ON public.gmb_listings FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "GMB users insert listings"
  ON public.gmb_listings FOR INSERT TO authenticated
  WITH CHECK (public.can_access_department('google-my-business'));

CREATE POLICY "Admins update gmb"
  ON public.gmb_listings FOR UPDATE TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "GMB users update listings"
  ON public.gmb_listings FOR UPDATE TO authenticated
  USING (public.can_access_department('google-my-business'))
  WITH CHECK (public.can_access_department('google-my-business'));

CREATE POLICY "Admins delete gmb"
  ON public.gmb_listings FOR DELETE TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY "GMB users delete listings"
  ON public.gmb_listings FOR DELETE TO authenticated
  USING (public.can_access_department('google-my-business'));

-- =====================
-- INFLUENCERS RLS
-- =====================
ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all influencers"
  ON public.influencers FOR SELECT TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Influencer dept users read"
  ON public.influencers FOR SELECT TO authenticated
  USING (public.can_access_department('influencers-promos'));

CREATE POLICY "Admins insert influencers"
  ON public.influencers FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Influencer dept users insert"
  ON public.influencers FOR INSERT TO authenticated
  WITH CHECK (public.can_access_department('influencers-promos'));

CREATE POLICY "Admins update influencers"
  ON public.influencers FOR UPDATE TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Influencer dept users update"
  ON public.influencers FOR UPDATE TO authenticated
  USING (public.can_access_department('influencers-promos'))
  WITH CHECK (public.can_access_department('influencers-promos'));

CREATE POLICY "Admins delete influencers"
  ON public.influencers FOR DELETE TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Influencer dept users delete"
  ON public.influencers FOR DELETE TO authenticated
  USING (public.can_access_department('influencers-promos'));

-- =====================
-- SUPPLIERS RLS
-- =====================
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all suppliers"
  ON public.suppliers FOR SELECT TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Restock dept users read suppliers"
  ON public.suppliers FOR SELECT TO authenticated
  USING (public.can_access_department('restock-suppliers'));

CREATE POLICY "Admins insert suppliers"
  ON public.suppliers FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Restock dept users insert suppliers"
  ON public.suppliers FOR INSERT TO authenticated
  WITH CHECK (public.can_access_department('restock-suppliers'));

CREATE POLICY "Admins update suppliers"
  ON public.suppliers FOR UPDATE TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Restock dept users update suppliers"
  ON public.suppliers FOR UPDATE TO authenticated
  USING (public.can_access_department('restock-suppliers'))
  WITH CHECK (public.can_access_department('restock-suppliers'));

CREATE POLICY "Admins delete suppliers"
  ON public.suppliers FOR DELETE TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Restock dept users delete suppliers"
  ON public.suppliers FOR DELETE TO authenticated
  USING (public.can_access_department('restock-suppliers'));

-- =====================
-- TEAM MEMBERS RLS
-- =====================
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all team members"
  ON public.team_members FOR SELECT TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Users read own team record"
  ON public.team_members FOR SELECT TO authenticated
  USING (email = (SELECT p.email FROM public.profiles p WHERE p.id = auth.uid()));

CREATE POLICY "Admins insert team members"
  ON public.team_members FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Admins update team members"
  ON public.team_members FOR UPDATE TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Admins delete team members"
  ON public.team_members FOR DELETE TO authenticated
  USING (public.get_user_role() = 'admin');

-- =====================
-- EXCHANGE RATES RLS
-- =====================
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users read exchange rates"
  ON public.exchange_rates FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Auth users upsert exchange rates"
  ON public.exchange_rates FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Auth users update exchange rates"
  ON public.exchange_rates FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);
