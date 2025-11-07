import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  email_to: string
  form_title: string
  submission_data: {
    name?: string
    phone?: string
    email?: string
    custom_fields?: Record<string, any>
  }
  metadata: {
    submitted_at: string
    ip_address?: string
    user_agent?: string
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body: NotificationRequest = await req.json()
    console.log('Sending notification to:', body.email_to)

    // Validate required fields
    if (!body.email_to || !body.form_title) {
      throw new Error('email_to and form_title are required')
    }

    const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')
    if (!BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY not configured')
    }

    // Build email content
    let htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">🔔 Nova Submissão de Formulário</h2>
        <p style="font-size: 16px; color: #666;">
          Você recebeu uma nova submissão no formulário: <strong>${body.form_title}</strong>
        </p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">📋 Dados da Submissão</h3>
    `

    // Add custom fields
    if (body.submission_data.custom_fields && Object.keys(body.submission_data.custom_fields).length > 0) {
      for (const [key, value] of Object.entries(body.submission_data.custom_fields)) {
        const displayValue = typeof value === 'object' ? JSON.stringify(value) : value
        htmlContent += `<p><strong>${key}:</strong> ${displayValue}</p>`
      }
    } else {
      htmlContent += `<p>Nenhum dado customizado foi enviado.</p>`
    }

    htmlContent += `</div>`

    // Add metadata
    htmlContent += `
      <div style="background: #fff; padding: 15px; border: 1px solid #e0e0e0; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #666; font-size: 14px;">📊 Informações Técnicas</h3>
        <p style="font-size: 13px; color: #888; margin: 5px 0;">
          <strong>Data/Hora:</strong> ${new Date(body.metadata.submitted_at).toLocaleString('pt-BR')}
        </p>
    `

    if (body.metadata.ip_address) {
      htmlContent += `<p style="font-size: 13px; color: #888; margin: 5px 0;"><strong>IP:</strong> ${body.metadata.ip_address}</p>`
    }
    if (body.metadata.user_agent) {
      htmlContent += `<p style="font-size: 13px; color: #888; margin: 5px 0;"><strong>Navegador:</strong> ${body.metadata.user_agent}</p>`
    }

    htmlContent += `
        </div>
        <p style="font-size: 12px; color: #999; margin-top: 30px;">
          Para ver todas as submissões, acesse seu dashboard.
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
          name: 'Notificações de Formulário',
          email: 'hubgox@gmail.com',
        },
        to: [
          {
            email: body.email_to,
          },
        ],
        subject: `🔔 Nova submissão - ${body.form_title}`,
        htmlContent: htmlContent,
      }),
    })

    if (!brevoResponse.ok) {
      const errorData = await brevoResponse.text()
      console.error('Brevo API error:', errorData)
      throw new Error(`Brevo API error: ${brevoResponse.status} - ${errorData}`)
    }

    const result = await brevoResponse.json()
    console.log('Email sent successfully via Brevo:', result)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification sent successfully',
        messageId: result.messageId 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in send-form-notification function:', error)
    
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
