-- Add has_goals field to categories table to control which categories have goals
ALTER TABLE public.categories ADD COLUMN has_goals BOOLEAN NOT NULL DEFAULT false;

-- Update existing categories to have goals enabled for water, energy, and waste by default
UPDATE public.categories 
SET has_goals = true 
WHERE name IN ('water', 'energy', 'waste');