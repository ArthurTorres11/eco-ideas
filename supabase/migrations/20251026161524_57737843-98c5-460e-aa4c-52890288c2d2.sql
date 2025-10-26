-- ========================================
-- CRITICAL SECURITY FIX: Migrate roles to separate table
-- ========================================

-- 1. Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, role::app_role FROM public.profiles;

-- 4. Update security definer functions to use user_roles table
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text 
  FROM public.user_roles 
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::app_role)
$$;

-- 5. Drop the role column from profiles WITH CASCADE to drop dependent policies
ALTER TABLE public.profiles DROP COLUMN role CASCADE;

-- 6. Recreate RLS policies that were dropped, now using the new functions

-- Ideas policies
CREATE POLICY "Admins can view all ideas" ON public.ideas
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update any idea" ON public.ideas
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view ideas based on role" ON public.ideas
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  ideas.user_id = auth.uid()
);

-- Notifications policies
CREATE POLICY "Admins can create notifications" ON public.notifications
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Settings policies
CREATE POLICY "Only admins can manage settings" ON public.settings
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ========================================
-- FIX: Activities table - restrict to relevant activities only
-- ========================================

-- Drop overly permissive policy
DROP POLICY IF EXISTS "Users can view all activities" ON public.activities;

-- Users can view activities related to their own actions OR ideas they can access
CREATE POLICY "Users can view relevant activities" ON public.activities
FOR SELECT
USING (
  auth.uid() = user_id OR
  public.has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.ideas
    WHERE ideas.id = activities.entity_id
    AND (ideas.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  )
);

-- ========================================
-- FIX: User points - only system can modify via triggers
-- ========================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "System can insert points" ON public.user_points;
DROP POLICY IF EXISTS "System can update points" ON public.user_points;

-- Create security definer function to manage points (called by triggers only)
CREATE OR REPLACE FUNCTION public.update_points_secure(
  _user_id uuid,
  _points_delta integer,
  _increment_submitted boolean DEFAULT false,
  _increment_approved boolean DEFAULT false,
  _increment_implemented boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_points (
    user_id, 
    total_points, 
    ideas_submitted, 
    ideas_approved, 
    ideas_implemented
  )
  VALUES (
    _user_id,
    _points_delta,
    CASE WHEN _increment_submitted THEN 1 ELSE 0 END,
    CASE WHEN _increment_approved THEN 1 ELSE 0 END,
    CASE WHEN _increment_implemented THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = user_points.total_points + _points_delta,
    ideas_submitted = user_points.ideas_submitted + CASE WHEN _increment_submitted THEN 1 ELSE 0 END,
    ideas_approved = user_points.ideas_approved + CASE WHEN _increment_approved THEN 1 ELSE 0 END,
    ideas_implemented = user_points.ideas_implemented + CASE WHEN _increment_implemented THEN 1 ELSE 0 END,
    updated_at = NOW();
END;
$$;

-- Update triggers to use the secure function
CREATE OR REPLACE FUNCTION public.update_user_points_on_create()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.update_points_secure(NEW.user_id, 0, true, false, false);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_user_points_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'Aprovada' AND (OLD.status IS NULL OR OLD.status != 'Aprovada') THEN
    PERFORM public.update_points_secure(NEW.user_id, 100, false, true, false);
    
    INSERT INTO public.activities (user_id, action_type, entity_type, entity_id, metadata)
    VALUES (
      NEW.user_id,
      'idea_approved',
      'idea',
      NEW.id,
      jsonb_build_object('title', NEW.title, 'points_earned', 100)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- ========================================
-- RLS Policies for user_roles
-- ========================================

-- Users can view all roles (for ranking, etc)
CREATE POLICY "Roles are viewable by everyone" ON public.user_roles
FOR SELECT
USING (true);

-- Only admins can manage roles
CREATE POLICY "Only admins can insert roles" ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update roles" ON public.user_roles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete roles" ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ========================================
-- Update handle_new_user to use user_roles
-- ========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (user_id) DO UPDATE SET
    name = COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    email = NEW.email,
    updated_at = now();
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Assign admin role if email matches
  IF NEW.email = 'admin@eco-ideias.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile/role for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;