import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const AI_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyzeRequest {
  title: string;
  description: string;
  category: string;
  existingIdeas?: Array<{ title: string; description: string; }>;
}

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

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
  
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Invalid authentication' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!AI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'Serviço de IA não configurado' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { title, description, category, existingIdeas = [] }: AnalyzeRequest = await req.json();

    console.log('Analisando ideia com IA:', { title, category });

    // Análise de sugestões
    const suggestionsPrompt = `
Você é um especialista em sustentabilidade. Analise a seguinte ideia e forneça 3-5 sugestões específicas para melhorá-la:

Título: ${title}
Descrição: ${description}
Categoria: ${category}

Retorne as sugestões em formato JSON:
{
  "suggestions": [
    { "title": "Título da sugestão", "description": "Descrição detalhada" }
  ]
}`;

    const suggestionsResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Você é um especialista em sustentabilidade que fornece sugestões práticas e acionáveis.' },
          { role: 'user', content: suggestionsPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
    });

    if (!suggestionsResponse.ok) {
      throw new Error('Erro ao consultar IA para sugestões');
    }

    const suggestionsData = await suggestionsResponse.json();
    const suggestions = JSON.parse(suggestionsData.choices[0].message.content);

    // Análise de similaridade
    let similarIdeas = [];
    let maxSimilarity = 0;

    if (existingIdeas.length > 0) {
      const similarityPrompt = `
Analise se a seguinte ideia é similar a alguma das ideias existentes:

NOVA IDEIA:
Título: ${title}
Descrição: ${description}

IDEIAS EXISTENTES:
${existingIdeas.map((idea, i) => `${i + 1}. ${idea.title}: ${idea.description}`).join('\n')}

Retorne em formato JSON:
{
  "similar_ideas": [
    { "index": 0, "similarity_score": 0.85, "reason": "Motivo da similaridade" }
  ],
  "max_similarity": 0.85
}

Similarity score deve ser entre 0 e 1, onde 1 é idêntico.`;

      const similarityResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'Você é um especialista em análise de similaridade de textos.' },
            { role: 'user', content: similarityPrompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        }),
      });

      if (similarityResponse.ok) {
        const similarityData = await similarityResponse.json();
        const similarity = JSON.parse(similarityData.choices[0].message.content);
        similarIdeas = similarity.similar_ideas || [];
        maxSimilarity = similarity.max_similarity || 0;
      }
    }

    return new Response(
      JSON.stringify({
        suggestions: suggestions.suggestions || [],
        similarIdeas,
        similarityScore: maxSimilarity,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Erro na análise de IA:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
