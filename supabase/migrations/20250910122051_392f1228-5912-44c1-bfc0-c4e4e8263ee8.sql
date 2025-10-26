-- Criar função para garantir usuário admin
CREATE OR REPLACE FUNCTION public.ensure_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Inserir ou atualizar perfil admin diretamente
  INSERT INTO public.profiles (
    user_id,
    name,
    email,
    role
  ) VALUES (
    'a0b1c2d3-e4f5-6789-abcd-ef0123456789'::uuid,
    'Admin Eco-Ideias',
    'admin@eco-ideias.com',
    'admin'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    role = 'admin',
    name = 'Admin Eco-Ideias',
    email = 'admin@eco-ideias.com',
    updated_at = now();
END;
$$;

-- Executar a função
SELECT public.ensure_admin_user();