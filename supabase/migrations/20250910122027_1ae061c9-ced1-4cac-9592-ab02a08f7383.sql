-- Criar usuário admin padrão
-- Primeiro, vamos garantir que existe um usuário admin no sistema
INSERT INTO auth.users (
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at,
  aud,
  role,
  encrypted_password,
  raw_user_meta_data
) VALUES (
  'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
  'admin@eco-ideias.com',
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated',
  crypt('admin123!', gen_salt('bf')),
  '{"name": "Admin Eco-Ideias"}'::jsonb
)
ON CONFLICT (email) DO NOTHING;

-- Garantir que o perfil admin existe
INSERT INTO public.profiles (
  user_id,
  name,
  email,
  role
) VALUES (
  'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
  'Admin Eco-Ideias',
  'admin@eco-ideias.com',
  'admin'
)
ON CONFLICT (user_id) DO UPDATE SET
  role = 'admin',
  updated_at = now();