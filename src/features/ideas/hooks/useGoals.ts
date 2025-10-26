import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Goals {
  [key: string]: number;
}

export const useGoals = () => {
  const [goals, setGoals] = useState<Goals>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .like('key', 'goal_%');

      if (error) {
        console.error('Error fetching goals:', error);
        return;
      }

      if (data) {
        const goalsMap = data.reduce((acc, setting) => {
          acc[setting.key] = parseFloat(setting.value) || 0;
          return acc;
        }, {} as Goals);

        setGoals(goalsMap);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh goals function that can be called externally
  const refreshGoals = () => {
    setLoading(true);
    fetchGoals();
  };

  return { goals, loading, refetch: fetchGoals, refresh: refreshGoals };
};