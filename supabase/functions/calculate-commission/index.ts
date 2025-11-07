import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { transaction_id } = await req.json();

    if (!transaction_id) {
      throw new Error('transaction_id is required');
    }

    console.log('Calculating commission for transaction:', transaction_id);

    // Get transaction details
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transaction_id)
      .single();

    if (txError) {
      console.error('Error fetching transaction:', txError);
      throw txError;
    }

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    console.log('Transaction status:', transaction.status);
    console.log('Affiliate ID:', transaction.affiliate_id);

    // Only calculate commission for completed transactions with affiliate
    if (transaction.status !== 'completed' || !transaction.affiliate_id) {
      console.log('Skipping commission - not completed or no affiliate');
      return new Response(
        JSON.stringify({ message: 'No commission to calculate' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get affiliate details
    const { data: affiliate, error: affError } = await supabase
      .from('affiliates')
      .select('*')
      .eq('id', transaction.affiliate_id)
      .single();

    if (affError) {
      console.error('Error fetching affiliate:', affError);
      throw affError;
    }

    // Calculate commission
    const commissionAmount = (Number(transaction.amount) * Number(affiliate.commission_rate)) / 100;

    console.log('Commission amount:', commissionAmount);

    // Check if commission already exists
    const { data: existingEarning } = await supabase
      .from('affiliate_earnings')
      .select('id')
      .eq('transaction_id', transaction_id)
      .maybeSingle();

    if (existingEarning) {
      console.log('Commission already exists for this transaction');
      return new Response(
        JSON.stringify({ message: 'Commission already calculated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create affiliate earning record
    const { error: earningError } = await supabase
      .from('affiliate_earnings')
      .insert({
        affiliate_id: transaction.affiliate_id,
        transaction_id: transaction_id,
        amount: commissionAmount,
        status: 'pending'
      });

    if (earningError) {
      console.error('Error creating earning:', earningError);
      throw earningError;
    }

    // Update affiliate totals
    const { error: updateError } = await supabase
      .from('affiliates')
      .update({
        total_earnings: Number(affiliate.total_earnings) + commissionAmount,
        total_referrals: Number(affiliate.total_referrals) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.affiliate_id);

    if (updateError) {
      console.error('Error updating affiliate totals:', updateError);
      throw updateError;
    }

    // Update transaction with commission amount
    const { error: txUpdateError } = await supabase
      .from('transactions')
      .update({
        affiliate_commission: commissionAmount
      })
      .eq('id', transaction_id);

    if (txUpdateError) {
      console.error('Error updating transaction:', txUpdateError);
      throw txUpdateError;
    }

    console.log('Commission calculated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        commission: commissionAmount,
        affiliate_id: transaction.affiliate_id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in calculate-commission:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
