-- Create settings table for configurable goals
CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create policies for settings
CREATE POLICY "Only admins can manage settings" 
ON public.settings 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_settings_updated_at
BEFORE UPDATE ON public.settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default goal values
INSERT INTO public.settings (key, value, description) VALUES
('goal_water_monthly', '10000', 'Meta mensal de água economizada (litros)'),
('goal_energy_monthly', '1000', 'Meta mensal de energia poupada (kWh)'),
('goal_co2_monthly', '500', 'Meta mensal de CO₂ reduzido (kg)'),
('goal_water_weekly', '2500', 'Meta semanal de água economizada (litros)'),
('goal_energy_weekly', '250', 'Meta semanal de energia poupada (kWh)'),
('goal_co2_weekly', '125', 'Meta semanal de CO₂ reduzido (kg)'),
('goal_water_daily', '350', 'Meta diária de água economizada (litros)'),
('goal_energy_daily', '35', 'Meta diária de energia poupada (kWh)'),
('goal_co2_daily', '18', 'Meta diária de CO₂ reduzido (kg)');