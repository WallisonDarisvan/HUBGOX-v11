import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Extract IP address (prioritize x-forwarded-for)
    const forwardedFor = req.headers.get('x-forwarded-for')
    const realIp = req.headers.get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0].trim() || realIp || 'unknown'
    
    // Extract User Agent
    const userAgent = req.headers.get('user-agent') || 'unknown'
    
    console.log('Received submission with IP:', ipAddress, 'User Agent:', userAgent)

    // Parse request body
    const body = await req.json()
    
    // Validate required fields
    if (!body.form_config_id) {
      throw new Error('form_config_id is required')
    }

    // Create Supabase client with service role (bypass RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Insert submission with IP and User Agent
    const { data, error } = await supabaseAdmin
      .from('form_submissions')
      .insert({
        form_config_id: body.form_config_id,
        name: body.name || null,
        phone: body.phone || null,
        email: body.email || null,
        custom_fields: body.custom_fields || {},
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    console.log('Form submission created successfully:', data.id)

    // Send notification email in background (if configured)
    const notificationPromise = (async () => {
      try {
        // Get form config to check for email_notification
        const { data: formConfig, error: configError } = await supabaseAdmin
          .from('form_configs')
          .select('email_notification, title')
          .eq('id', body.form_config_id)
          .single()

        if (configError) {
          console.error('Error fetching form config:', configError)
          return
        }

        if (!formConfig?.email_notification) {
          console.log('No email notification configured for this form')
          return
        }

        console.log('Sending notification to:', formConfig.email_notification)

        // Call send-form-notification edge function
        const notificationResponse = await supabaseAdmin.functions.invoke('send-form-notification', {
          body: {
            email_to: formConfig.email_notification,
            form_title: formConfig.title,
            submission_data: {
              name: body.name,
              phone: body.phone,
              email: body.email,
              custom_fields: body.custom_fields,
            },
            metadata: {
              submitted_at: data.created_at || new Date().toISOString(),
              ip_address: ipAddress,
              user_agent: userAgent,
            },
          },
        })

        if (notificationResponse.error) {
          console.error('Error sending notification:', notificationResponse.error)
        } else {
          console.log('Notification sent successfully:', notificationResponse.data)
        }
      } catch (error) {
        console.error('Error in notification process:', error)
      }
    })()

    // Run notification in background (don't await)
    notificationPromise.catch(err => console.error('Background notification error:', err))

    return new Response(
      JSON.stringify({ 
        success: true, 
        id: data.id,
        message: 'Form submitted successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in submit-form function:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
