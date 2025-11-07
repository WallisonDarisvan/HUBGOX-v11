-- Create affiliates table
CREATE TABLE public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  affiliate_code TEXT NOT NULL UNIQUE,
  commission_rate NUMERIC NOT NULL DEFAULT 10.0,
  status TEXT NOT NULL DEFAULT 'active',
  total_referrals INTEGER NOT NULL DEFAULT 0,
  total_earnings NUMERIC NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_id TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  stripe_payment_id TEXT,
  affiliate_id UUID,
  affiliate_commission NUMERIC,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create affiliate_earnings table
CREATE TABLE public.affiliate_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL,
  transaction_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_affiliates_user_id ON public.affiliates(user_id);
CREATE INDEX idx_affiliates_code ON public.affiliates(affiliate_code);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_affiliate ON public.transactions(affiliate_id);
CREATE INDEX idx_affiliate_earnings_affiliate ON public.affiliate_earnings(affiliate_id);
CREATE INDEX idx_affiliate_earnings_transaction ON public.affiliate_earnings(transaction_id);

-- Enable RLS
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_earnings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for affiliates
CREATE POLICY "Devs can view all affiliates"
  ON public.affiliates FOR SELECT
  USING (public.has_role(auth.uid(), 'dev'));

CREATE POLICY "Devs can insert affiliates"
  ON public.affiliates FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'dev'));

CREATE POLICY "Devs can update affiliates"
  ON public.affiliates FOR UPDATE
  USING (public.has_role(auth.uid(), 'dev'));

CREATE POLICY "Affiliates can view their own data"
  ON public.affiliates FOR SELECT
  USING (user_id = auth.uid());

-- RLS Policies for transactions
CREATE POLICY "Devs can view all transactions"
  ON public.transactions FOR SELECT
  USING (public.has_role(auth.uid(), 'dev'));

CREATE POLICY "Devs can insert transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'dev'));

CREATE POLICY "Devs can update transactions"
  ON public.transactions FOR UPDATE
  USING (public.has_role(auth.uid(), 'dev'));

CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (user_id = auth.uid());

-- RLS Policies for affiliate_earnings
CREATE POLICY "Devs can view all earnings"
  ON public.affiliate_earnings FOR SELECT
  USING (public.has_role(auth.uid(), 'dev'));

CREATE POLICY "Devs can insert earnings"
  ON public.affiliate_earnings FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'dev'));

CREATE POLICY "Devs can update earnings"
  ON public.affiliate_earnings FOR UPDATE
  USING (public.has_role(auth.uid(), 'dev'));

CREATE POLICY "Affiliates can view their own earnings"
  ON public.affiliate_earnings FOR SELECT
  USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_affiliates_updated_at
  BEFORE UPDATE ON public.affiliates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();