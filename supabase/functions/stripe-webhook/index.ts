import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Webhook received");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2025-08-27.basil" 
    });

    const signature = req.headers.get("stripe-signature");
    const body = await req.text();
    
    if (!signature) {
      throw new Error("No stripe signature found");
    }

    // Verify webhook signature
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET not configured");
    }

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    logStep("Webhook verified", { type: event.type });

    // Handle checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Checkout session completed", { sessionId: session.id });

      const userId = session.metadata?.user_id;
      const planId = session.metadata?.plan_id;
      const affiliateId = session.metadata?.affiliate_id;
      const amount = session.amount_total ? session.amount_total / 100 : 0; // Convert from cents

      if (!userId || !planId) {
        logStep("Missing required metadata", { userId, planId });
        throw new Error("Missing user_id or plan_id in metadata");
      }

      // Buscar o plano para obter detalhes
      const { data: plan } = await supabaseClient
        .from('plan_definitions')
        .select('plan_name, stripe_product_id')
        .eq('plan_id', planId)
        .single();

      // Criar transação
      const { data: transaction, error: txError } = await supabaseClient
        .from('transactions')
        .insert({
          user_id: userId,
          amount: amount,
          currency: 'BRL',
          status: 'completed',
          transaction_type: 'subscription',
          stripe_session_id: session.id,
          stripe_subscription_id: session.subscription as string,
          plan_id: planId,
          affiliate_id: affiliateId || null,
          transaction_date: new Date().toISOString()
        })
        .select()
        .single();

      if (txError) {
        logStep("Error creating transaction", { error: txError });
        throw txError;
      }

      logStep("Transaction created", { transactionId: transaction.id });

      // Atualizar o plano do usuário na tabela user_plans
      const { error: planError } = await supabaseClient
        .from('user_plans')
        .upsert({
          user_id: userId,
          plan_id: planId,
          stripe_subscription_id: session.subscription as string,
          subscription_status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
        }, {
          onConflict: 'user_id'
        });

      if (planError) {
        logStep("Error updating user plan", { error: planError });
      } else {
        logStep("User plan updated");
      }

      // Se houver afiliado, calcular comissão
      if (affiliateId && transaction.id) {
        logStep("Calculating commission for affiliate", { affiliateId });
        
        const { error: commissionError } = await supabaseClient.functions.invoke(
          'calculate-commission',
          {
            body: { transaction_id: transaction.id }
          }
        );

        if (commissionError) {
          logStep("Error calculating commission", { error: commissionError });
        } else {
          logStep("Commission calculated successfully");
        }
      }

      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Handle subscription updated/canceled events
    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      logStep("Subscription event", { type: event.type, subscriptionId: subscription.id });

      const status = subscription.status === "active" ? "active" : 
                     subscription.status === "canceled" ? "canceled" : 
                     subscription.status;

      const { error } = await supabaseClient
        .from('user_plans')
        .update({
          subscription_status: status,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
        })
        .eq('stripe_subscription_id', subscription.id);

      if (error) {
        logStep("Error updating subscription status", { error });
      } else {
        logStep("Subscription status updated", { status });
      }

      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Unhandled event type", { type: event.type });
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
