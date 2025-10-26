import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  email: string;
  userName: string;
  ideaTitle: string;
  oldStatus: string;
  newStatus: string;
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

  // Verify admin role
  const { data: roleData, error: roleError } = await supabaseClient.rpc('has_role', {
    _user_id: user.id,
    _role: 'admin'
  });

  if (roleError || !roleData) {
    return new Response(
      JSON.stringify({ error: 'Admin access required' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { email, userName, ideaTitle, oldStatus, newStatus }: NotificationRequest = await req.json();

    const statusEmoji = newStatus === 'Aprovada' ? '✅' : newStatus === 'Reprovada' ? '❌' : '🔄';
    const statusColor = newStatus === 'Aprovada' ? '#10b981' : newStatus === 'Reprovada' ? '#ef4444' : '#f59e0b';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Atualização de Status - Eco Ideias</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #10b981; margin: 0; font-size: 32px; font-weight: bold;">🌱 Eco Ideias</h1>
            </div>
            
            <h2 style="color: #1f2937; margin: 0 0 24px 0; font-size: 24px;">
              ${statusEmoji} Atualização de Status
            </h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
              Olá <strong>${userName}</strong>,
            </p>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin: 0 0 24px 0;">
              Sua ideia "<strong>${ideaTitle}</strong>" teve o status atualizado.
            </p>
            
            <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: #6b7280; font-size: 14px;">Status Anterior:</span>
                <span style="color: #1f2937; font-weight: 600;">${oldStatus}</span>
              </div>
              <div style="height: 1px; background: #e5e7eb; margin: 12px 0;"></div>
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="color: #6b7280; font-size: 14px;">Novo Status:</span>
                <span style="color: ${statusColor}; font-weight: 700; font-size: 16px;">${newStatus}</span>
              </div>
            </div>
            
            ${newStatus === 'Aprovada' ? `
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px; padding: 20px; margin: 24px 0; color: white;">
                <p style="margin: 0; font-size: 16px; line-height: 1.5;">
                  🎉 <strong>Parabéns!</strong> Sua ideia foi aprovada e você ganhou <strong>100 pontos</strong>!
                </p>
              </div>
            ` : ''}
            
            <div style="margin-top: 32px; padding-top: 24px; border-top: 2px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 0;">
                Continue contribuindo com ideias sustentáveis!
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 24px;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} Eco Ideias - Plataforma de Sustentabilidade
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: 'Eco Ideias <onboarding@resend.dev>',
      to: [email],
      subject: `${statusEmoji} Status da Ideia: ${ideaTitle}`,
      html,
    });

    if (error) {
      console.error('Erro ao enviar email:', error);
      throw error;
    }

    console.log('Email enviado com sucesso:', data);

    return new Response(
      JSON.stringify({ success: true, data }), 
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Erro na função send-status-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
