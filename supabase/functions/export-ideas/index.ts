import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify authentication
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Authentication required' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { format = 'csv', filters = {} } = await req.json();
    
    let query = supabaseClient
      .from('ideas')
      .select(`
        *,
        profiles!ideas_user_id_fkey(name, email)
      `)
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data: ideas, error } = await query;

    if (error) throw error;

    if (format === 'csv') {
      // Gerar CSV
      const headers = ['ID', 'Título', 'Descrição', 'Categoria', 'Impacto', 'Status', 'Usuário', 'Email', 'Data Criação'];
      const csvRows = [headers.join(',')];

      ideas?.forEach((idea: any) => {
        const row = [
          idea.id,
          `"${idea.title.replace(/"/g, '""')}"`,
          `"${idea.description.replace(/"/g, '""')}"`,
          idea.category,
          idea.impact || '',
          idea.status,
          idea.profiles?.name || '',
          idea.profiles?.email || '',
          new Date(idea.created_at).toLocaleString('pt-BR'),
        ];
        csvRows.push(row.join(','));
      });

      const csv = csvRows.join('\n');

      return new Response(csv, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="ideias_${new Date().toISOString()}.csv"`,
        },
      });
    } else {
      // Retornar JSON
      return new Response(
        JSON.stringify({ ideas }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

  } catch (error: any) {
    console.error('Erro ao exportar ideias:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
