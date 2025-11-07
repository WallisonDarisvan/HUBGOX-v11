import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SupportEmailRequest {
  name: string
  email: string
  subject: string
  message: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body: SupportEmailRequest = await req.json()
    console.log('Sending support email from:', body.email)

    // Validate required fields
    if (!body.name || !body.email || !body.subject || !body.message) {
      throw new Error('All fields are required')
    }

    const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')
    if (!BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY not configured')
    }

    // Build email content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">📧 Nova Mensagem de Suporte</h2>
        <p style="font-size: 16px; color: #666;">
          Você recebeu uma nova mensagem através do formulário de suporte.
        </p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">📋 Dados do Remetente</h3>
          <p><strong>Nome:</strong> ${body.name}</p>
          <p><strong>Email:</strong> ${body.email}</p>
          <p><strong>Assunto:</strong> ${body.subject}</p>
        </div>

        <div style="background: #fff; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">💬 Mensagem</h3>
          <p style="white-space: pre-wrap; line-height: 1.6;">${body.message}</p>
        </div>

        <div style="background: #fff; padding: 15px; border: 1px solid #e0e0e0; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #666; font-size: 14px;">📊 Informações Técnicas</h3>
          <p style="font-size: 13px; color: #888; margin: 5px 0;">
            <strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}
          </p>
        </div>
        
        <p style="font-size: 12px; color: #999; margin-top: 30px;">
          Responda este email diretamente para o remetente.
        </p>
      </div>
    `

    // Send email via Brevo
    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: body.name,
          email: body.email,
        },
        to: [
          {
            email: 'hubgox@gmail.com',
            name: 'Suporte HubGox',
          },
        ],
        replyTo: {
          email: body.email,
          name: body.name,
        },
        subject: `[Suporte] ${body.subject}`,
        htmlContent: htmlContent,
      }),
    })

    if (!brevoResponse.ok) {
      const errorData = await brevoResponse.text()
      console.error('Brevo API error:', errorData)
      throw new Error(`Brevo API error: ${brevoResponse.status} - ${errorData}`)
    }

    const result = await brevoResponse.json()
    console.log('Support email sent successfully via Brevo:', result)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Support email sent successfully',
        messageId: result.messageId 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in send-support-email function:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
