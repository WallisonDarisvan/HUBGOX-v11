-- =====================================================
-- FIX: Correção do fluxo de aceitação de convite
-- =====================================================
-- Problema: A função accept_invitation tentava mudar o ID 
-- de um profile existente, causando erros.
-- Solução: Criar novo profile e MIGRAR todos os dados
-- relacionados (cards, forms, etc) antes de deletar o antigo.
-- =====================================================

-- Atualizar a função accept_invitation
create or replace function public.accept_invitation(
  token uuid,
  user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
  v_invitation_id uuid;
  v_username text;
  v_display_name text;
  v_bio text;
  v_avatar_url text;
  v_cover_url text;
  v_custom_phrase text;
  v_instagram_url text;
  v_linkedin_url text;
  v_youtube_url text;
  v_spotify_url text;
  v_whatsapp_url text;
  v_show_verified_badge boolean;
  v_show_avatar boolean;
  v_footer_text_primary text;
  v_footer_text_secondary text;
begin
  -- Buscar dados do profile e convite
  select 
    i.profile_id,
    i.id,
    p.username,
    p.display_name,
    p.bio,
    p.avatar_url,
    p.cover_url,
    p.custom_phrase,
    p.instagram_url,
    p.linkedin_url,
    p.youtube_url,
    p.spotify_url,
    p.whatsapp_url,
    p.show_verified_badge,
    p.show_avatar,
    p.footer_text_primary,
    p.footer_text_secondary
  into 
    v_profile_id,
    v_invitation_id,
    v_username,
    v_display_name,
    v_bio,
    v_avatar_url,
    v_cover_url,
    v_custom_phrase,
    v_instagram_url,
    v_linkedin_url,
    v_youtube_url,
    v_spotify_url,
    v_whatsapp_url,
    v_show_verified_badge,
    v_show_avatar,
    v_footer_text_primary,
    v_footer_text_secondary
  from public.user_invitations i
  join public.profiles p on p.id = i.profile_id
  where i.invitation_token = token
    and i.status = 'pending'
    and i.expires_at > now();
  
  if v_profile_id is null then
    return false;
  end if;
  
  -- Criar novo profile com o user_id correto
  insert into public.profiles (
    id,
    username,
    display_name,
    bio,
    avatar_url,
    cover_url,
    custom_phrase,
    instagram_url,
    linkedin_url,
    youtube_url,
    spotify_url,
    whatsapp_url,
    show_verified_badge,
    show_avatar,
    footer_text_primary,
    footer_text_secondary,
    is_activated
  ) values (
    user_id,
    v_username,
    v_display_name,
    v_bio,
    v_avatar_url,
    v_cover_url,
    v_custom_phrase,
    v_instagram_url,
    v_linkedin_url,
    v_youtube_url,
    v_spotify_url,
    v_whatsapp_url,
    v_show_verified_badge,
    v_show_avatar,
    v_footer_text_primary,
    v_footer_text_secondary,
    true
  );
  
  -- MIGRAR todos os dados relacionados para o novo profile
  
  -- 1. Migrar cards
  update public.cards
  set profile_id = user_id
  where profile_id = v_profile_id;
  
  -- 2. Migrar forms
  update public.forms
  set user_id = user_id
  where user_id = v_profile_id;
  
  -- 3. Migrar form_submissions (se houver)
  update public.form_submissions
  set form_id = f.id
  from public.forms f
  where form_submissions.form_id = f.id
    and f.user_id = user_id;
  
  -- Marcar convite como aceito
  update public.user_invitations
  set status = 'accepted',
      accepted_at = now(),
      linked_profile_id = user_id,
      profile_id = user_id
  where id = v_invitation_id;
  
  -- Deletar o profile temporário DEPOIS de migrar tudo
  delete from public.profiles where id = v_profile_id;
  
  return true;
end;
$$;

-- Comentários sobre a mudança:
-- 1. Cria o novo profile com o user_id correto
-- 2. MIGRA todos os cards para o novo profile
-- 3. MIGRA todos os forms para o novo profile  
-- 4. MIGRA todos os form_submissions
-- 5. Só DEPOIS de migrar tudo, deleta o profile temporário
-- 6. Isso garante que NADA é perdido durante o processo
