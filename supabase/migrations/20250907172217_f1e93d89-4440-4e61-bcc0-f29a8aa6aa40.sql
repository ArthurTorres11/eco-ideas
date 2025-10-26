-- Fix the database relationship and add proper foreign key
-- First, let's add a proper foreign key relationship between ideas and profiles
ALTER TABLE public.ideas 
ADD CONSTRAINT fk_ideas_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add an index for better performance on user_id lookups
CREATE INDEX IF NOT EXISTS idx_ideas_user_id ON public.ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_ideas_status ON public.ideas(status);
CREATE INDEX IF NOT EXISTS idx_ideas_created_at ON public.ideas(created_at);

-- Add an index on profiles for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- Update the ideas table to ensure better performance and add missing constraints
ALTER TABLE public.ideas 
ADD CONSTRAINT chk_ideas_status 
CHECK (status IN ('Em Análise', 'Aprovada', 'Reprovada'));

-- Add RLS policy to allow admins to see all profiles (needed for the join)
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.user_id = auth.uid() AND p.role = 'admin'
));

-- Allow users to see profiles for idea authors
CREATE POLICY "Users can view idea authors profiles" 
ON public.profiles 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.ideas i 
  WHERE i.user_id = profiles.user_id
));