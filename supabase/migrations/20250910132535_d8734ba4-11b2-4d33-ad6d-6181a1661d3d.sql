-- Create categories table for impact categories
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'unidades',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policies for categories (readable by everyone, manageable by admins)
CREATE POLICY "Categories are viewable by everyone" 
ON public.categories 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can insert categories" 
ON public.categories 
FOR INSERT 
WITH CHECK (is_current_user_admin());

CREATE POLICY "Only admins can update categories" 
ON public.categories 
FOR UPDATE 
USING (is_current_user_admin());

CREATE POLICY "Only admins can delete categories" 
ON public.categories 
FOR DELETE 
USING (is_current_user_admin());

-- Create trigger for timestamps
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories based on existing system
INSERT INTO public.categories (name, display_name, description, unit) VALUES
('water', 'Conservação de Água', 'Ideias relacionadas à economia e conservação de água', 'litros'),
('energy', 'Eficiência Energética', 'Ideias para redução do consumo de energia', 'kWh'),
('waste', 'Redução de Resíduos', 'Ideias para diminuir e gerenciar resíduos', 'kg'),
('transport', 'Transporte Sustentável', 'Ideias para mobilidade sustentável', 'km'),
('materials', 'Materiais Sustentáveis', 'Ideias sobre uso de materiais eco-friendly', 'kg'),
('biodiversity', 'Biodiversidade', 'Ideias para preservação da biodiversidade', 'unidades');

-- Update settings table to be more flexible for dynamic goals
-- Remove existing fixed goals
DELETE FROM public.settings WHERE key LIKE 'goal_%';

-- Add new dynamic goal structure based on categories
INSERT INTO public.settings (key, value, description)
SELECT 
  'goal_' || c.name || '_daily' as key,
  CASE 
    WHEN c.name = 'water' THEN '350'
    WHEN c.name = 'energy' THEN '35'
    WHEN c.name = 'waste' THEN '18'
    ELSE '10'
  END as value,
  'Meta diária para ' || c.display_name || ' (' || c.unit || ')' as description
FROM public.categories c;

INSERT INTO public.settings (key, value, description)
SELECT 
  'goal_' || c.name || '_weekly' as key,
  CASE 
    WHEN c.name = 'water' THEN '2500'
    WHEN c.name = 'energy' THEN '250'
    WHEN c.name = 'waste' THEN '125'
    ELSE '70'
  END as value,
  'Meta semanal para ' || c.display_name || ' (' || c.unit || ')' as description
FROM public.categories c;

INSERT INTO public.settings (key, value, description)
SELECT 
  'goal_' || c.name || '_monthly' as key,
  CASE 
    WHEN c.name = 'water' THEN '10000'
    WHEN c.name = 'energy' THEN '1000'
    WHEN c.name = 'waste' THEN '500'
    ELSE '300'
  END as value,
  'Meta mensal para ' || c.display_name || ' (' || c.unit || ')' as description
FROM public.categories c;