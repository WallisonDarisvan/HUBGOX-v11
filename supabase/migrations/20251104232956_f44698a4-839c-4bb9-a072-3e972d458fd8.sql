-- =====================================================
-- FASE 5: Script de Verificação de Integridade
-- =====================================================
-- Verifica dados órfãos no sistema antes das correções
-- =====================================================

DO $$
DECLARE
  orphaned_links integer;
  orphaned_cards integer;
  orphaned_forms integer;
  orphaned_list_items integer;
BEGIN
  -- Verificar link_lists órfãos
  SELECT COUNT(*) INTO orphaned_links
  FROM public.link_lists
  WHERE user_id NOT IN (SELECT id FROM public.profiles);
  
  -- Verificar cards órfãos
  SELECT COUNT(*) INTO orphaned_cards
  FROM public.cards
  WHERE user_id NOT IN (SELECT id FROM public.profiles);
  
  -- Verificar form_configs órfãos
  SELECT COUNT(*) INTO orphaned_forms
  FROM public.form_configs
  WHERE user_id NOT IN (SELECT id FROM public.profiles);
  
  -- Verificar list_items órfãos
  SELECT COUNT(*) INTO orphaned_list_items
  FROM public.list_items
  WHERE list_id NOT IN (SELECT id FROM public.link_lists);
  
  -- Reportar
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'VERIFICAÇÃO DE DADOS ÓRFÃOS';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'link_lists órfãos: %', orphaned_links;
  RAISE NOTICE 'cards órfãos: %', orphaned_cards;
  RAISE NOTICE 'form_configs órfãos: %', orphaned_forms;
  RAISE NOTICE 'list_items órfãos: %', orphaned_list_items;
  RAISE NOTICE '==========================================';
  
  IF orphaned_links > 0 OR orphaned_cards > 0 OR orphaned_forms > 0 OR orphaned_list_items > 0 THEN
    RAISE WARNING 'Foram encontrados dados órfãos! Serão limpos na próxima migração.';
  ELSE
    RAISE NOTICE '✅ Nenhum dado órfão encontrado!';
  END IF;
END $$;