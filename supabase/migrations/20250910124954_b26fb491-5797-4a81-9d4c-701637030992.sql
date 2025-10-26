-- Update the admin user role in profiles table
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'admin@eco-ideias.com';