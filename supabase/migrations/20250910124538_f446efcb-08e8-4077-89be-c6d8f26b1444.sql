-- Create admin profile directly (the handle_new_user trigger will create the auth user)
-- First, let's insert into profiles manually for the admin user
INSERT INTO public.profiles (user_id, name, email, role)
VALUES (
  gen_random_uuid(),
  'Admin',
  'admin@eco-ideias.com',
  'admin'
) ON CONFLICT (user_id) DO NOTHING;