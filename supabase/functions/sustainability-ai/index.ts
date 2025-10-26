import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AI Configuration
const AI_API_KEY = Deno.env.get('AI_API_KEY');

const SUSTAINABILITY_CONTEXT = `
Você é um assistente especializado em sustentabilidade para uma plataforma de eco-ideias. Seu papel é:

1. ORIENTAR sobre categorias de impacto:
   - Conservação de Água
   - Eficiência Energética  
   - Redução de Resíduos
   - Transporte Sustentável
   - Materiais Sustentáveis
   - Biodiversidade

2. SUGERIR melhorias e alternativas sustentáveis
3. EXPLICAR impactos ambientais e benefícios
4. FORNECER dados e estatísticas quando relevante
5. AUXILIAR na quantificação de impactos (litros, kWh, kg, toneladas, %, unidades)

Seja sempre positivo, educativo e prático. Responda em português brasileiro.
`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify authentication
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Autenticação necessária' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
  
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Autenticação inválida' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!AI_API_KEY) {
    console.error('Serviço de IA não configurado. Certifique-se de definir a chave de API');
    return new Response(
      JSON.stringify({ error: 'Serviço de IA não configurado' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const { message } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Mensagem é obrigatória' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Consultando serviço de IA com mensagem:', message);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: SUSTAINABILITY_CONTEXT
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API de IA:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Erro na consulta à IA' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    console.log('Resposta da IA:', data);
    
    const reply = data.choices?.[0]?.message?.content || 'Desculpe, não consegui gerar uma resposta.';

    return new Response(
      JSON.stringify({ reply }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erro no sustainability-ai:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});