-- Adicionar colunas para vincular produtos Stripe aos planos
ALTER TABLE plan_definitions 
ADD COLUMN IF NOT EXISTS stripe_product_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- Atualizar planos com os IDs do Stripe criados
UPDATE plan_definitions 
SET stripe_product_id = 'prod_TNMxwHjvZnBdyL',
    stripe_price_id = 'price_1SQcDtDpS9nuyRJNtHA8Dizx'
WHERE plan_id = 'individual';

UPDATE plan_definitions 
SET stripe_product_id = 'prod_TNMyiSIyP9q8Im',
    stripe_price_id = 'price_1SQcEHDpS9nuyRJNnvUXN59j'
WHERE plan_id = 'hard';

UPDATE plan_definitions 
SET stripe_product_id = 'prod_TNMyZpgMeYwARx',
    stripe_price_id = 'price_1SQcEbDpS9nuyRJNaJtSTmB0'
WHERE plan_id = 'agency';

UPDATE plan_definitions 
SET stripe_product_id = 'prod_TNMzmXFmOM78ud',
    stripe_price_id = 'price_1SQcFHDpS9nuyRJNZeDUqoUb'
WHERE plan_id = 'corporate';