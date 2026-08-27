import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const identity = read('supabase/migrations/202608270001_identity_profiles.sql');
const chat = read('supabase/migrations/202608270002_chat_private_moderation.sql');
const social = read('supabase/migrations/202608270003_opin_baul_media.sql');
const security = read('supabase/migrations/202608270004_rls_storage_realtime.sql');
const rpc = read('supabase/migrations/202608270005_baul_rpc.sql');
const privateChatRpc = read('supabase/migrations/202608270006_private_chat_rpc.sql');
const opinMetrics = read('supabase/migrations/202608270007_opin_metrics.sql');
const privateContacts = read('supabase/migrations/202608270008_private_contacts.sql');
const moderationRpc = read('supabase/migrations/202608270009_moderation_rpc.sql');
const publicChatModeration = read('supabase/migrations/202608270010_public_chat_moderation.sql');
const systemNotifications = read('supabase/migrations/202608270011_system_notifications.sql');
const chatStates = read('supabase/migrations/202608270012_chat_states.sql');
const reportsModeration = read('supabase/migrations/202608270013_reports_moderation.sql');
const events = read('supabase/migrations/202608270014_events.sql');
const verification = read('supabase/migrations/202608270015_verification.sql');
const rewards = read('supabase/migrations/202608270016_rewards.sql');
const activityRanking = read('supabase/migrations/202608270017_activity_ranking.sql');
const tickets = read('supabase/migrations/202608270018_tickets.sql');
const analytics = read('supabase/migrations/202608270019_analytics.sql');
const dailyLimits = read('supabase/migrations/202608270020_daily_limits.sql');
const esencias = read('supabase/migrations/202608270021_esencias.sql');
const forum = read('supabase/migrations/202608270022_forum.sql');
const contactSafety = read('supabase/migrations/202608270023_contact_safety.sql');
const badges = read('supabase/migrations/202608270024_badges.sql');
const featuredAds = read('supabase/migrations/202608270025_featured_ads.sql');
const baulMediaPaths = read('supabase/migrations/202608270026_baul_media_paths.sql');
const chatRepliesProfileGuards = read('supabase/migrations/202608270027_chat_replies_profile_guards.sql');
const privateRepliesRpc = read('supabase/migrations/202608270028_private_replies_rpc.sql');
const securityDefinerGrants = read('supabase/migrations/202608270029_security_definer_grants.sql');
const baulSetLike = read('supabase/migrations/202608270030_baul_set_like.sql');
const baulMatchReads = read('supabase/migrations/202608270031_baul_match_reads.sql');
const baulMediaReadPolicies = read('supabase/migrations/202608270032_baul_media_read_policies.sql');
const ticketLogHardening = read('supabase/migrations/202608270033_ticket_log_hardening.sql');
const privateRequestNotificationState = read('supabase/migrations/202608270034_private_request_notification_state.sql');
const explicitTableGrants = read('supabase/migrations/202608270035_explicit_table_grants.sql');
const publicChatService = read('src/services/supabaseChatService.js');
const chatService = read('src/services/chatService.js');
const baulPromo = read('src/components/baul/BaulPromoCard.jsx');
const chatInput = read('src/components/chat/ChatInput.jsx');
const chatPage = read('src/pages/ChatPage.jsx');
const tarjetaEditor = read('src/components/baul/TarjetaEditor.jsx');
const baulService = read('src/services/supabaseBaulService.js');
const app = read('src/App.jsx');
const rewardsService = read('src/services/rewardsService.js');
const allSql = [identity, chat, social, security, rpc, privateChatRpc, opinMetrics, privateContacts, moderationRpc, publicChatModeration, systemNotifications, chatStates, reportsModeration, events, verification, rewards, activityRanking, tickets, analytics, dailyLimits, esencias, forum, contactSafety, badges, featuredAds, baulMediaPaths, chatRepliesProfileGuards, privateRepliesRpc, securityDefinerGrants, baulSetLike, baulMatchReads, baulMediaReadPolicies, ticketLogHardening, privateRequestNotificationState, explicitTableGrants].join('\\n');

describe('Supabase migration contract', () => {
  it('creates the identity foundation before feature tables', () => {
    expect(identity).toContain('create table if not exists public.profiles');
    expect(identity).toContain('references auth.users(id)');
    expect(identity).toContain('public.user_migration_map');
    expect(identity).toContain('on_auth_user_created_profile');
    expect(identity.indexOf('public.profiles')).toBeLessThan(identity.indexOf('public.rooms'));
  });

  it('models public and private chat without Firebase collection names', () => {
    expect(chat).toContain('public.messages');
    expect(chat).toContain('public.conversations');
    expect(chat).toContain('public.conversation_members');
    expect(chat).toContain('public.private_messages');
    expect(chat).toContain('public.private_requests');
    expect(chat).toContain('public.message_receipts');
    expect(chat).not.toContain('firebase');
  });

  it('models OPIN, Baul, matches and media as relational tables', () => {
    expect(social).toContain('public.opin_posts');
    expect(social).toContain('public.opin_comments');
    expect(social).toContain('public.baul_cards');
    expect(social).toContain('public.baul_likes');
    expect(social).toContain('public.baul_matches');
    expect(social).toContain('public.media_objects');
    expect(social).toContain('public.contacts');
    expect(social).toContain('public.saved_profiles');
  });

  it('enables RLS and leaves server-owned interactions without client write policies', () => {
    expect(security).toContain('alter table public.profiles enable row level security');
    expect(security).toContain('alter table public.baul_likes enable row level security');
    expect(security).toContain('No client write policies for baul_likes');
    expect(security).toContain('public.is_conversation_member');
    expect(security).toContain("bucket_id = 'chat-private'");
    expect(security).toContain('supabase_realtime');
  });

  it('hardens private chat with separate receipts, policies and atomic RPCs', () => {
    expect(privateChatRpc).toContain('public.private_message_receipts');
    expect(privateChatRpc).toContain('private_typing_owner_insert');
    expect(privateChatRpc).toContain('public.get_or_create_direct_conversation');
    expect(privateChatRpc).toContain('public.send_private_message');
    expect(privateChatRpc).toContain('public.respond_private_request');
    expect(privateChatRpc).toContain('revoke insert, update, delete on table public.private_messages');
    expect(privateChatRpc).not.toContain("from public.message_receipts");
  });

  it('derives OPIN counters and actions server-side', () => {
    expect(opinMetrics).toContain('public.refresh_opin_post_metrics');
    expect(opinMetrics).toContain('opin_posts_protect_metrics');
    expect(opinMetrics).toContain('public.record_opin_action');
    expect(opinMetrics).toContain("interval '24 hours'");
  });

  it('models private contact sharing without exposing phone in public profiles', () => {
    expect(privateContacts).toContain('public.profile_private_contacts');
    expect(privateContacts).toContain('public.private_contact_shares');
    expect(privateContacts).toContain('public.get_private_chat_shared_contacts');
    expect(privateContacts).toContain('expires_at > now()');
  });

  it('uses RPCs for Baul interactions and validates authenticated callers', () => {
    expect(rpc).toContain('public.toggle_baul_like(uuid)');
    expect(read('supabase/migrations/202608270030_baul_set_like.sql')).toContain('public.set_baul_like');
    expect(baulService).toContain("rpc('set_baul_like'");
    expect(baulMatchReads).toContain('public.get_my_baul_unread_match_count');
    expect(baulMatchReads).toContain('public.mark_my_baul_match_read');
    expect(baulMediaReadPolicies).toContain("bucket_id = 'card-media'");
    expect(baulMediaReadPolicies).toContain('c.foto2_path = name');
    expect(baulService).toContain('refreshSignedMediaUrl');
    expect(baulService).toContain("from('room_presence')");
    expect(baulService).toContain('actualizarEstadoOnline = async (userId, estaOnline, roomId =');
    expect(baulSetLike).toContain('set_baul_like');
    expect(baulSetLike).toContain('v_actor_id');
    expect(rpc).toContain('public.record_baul_daily_event');
    expect(rpc).toContain('public.send_baul_note');
    expect(rpc).toContain('auth.uid()');
    expect(rpc).toContain('pg_advisory_xact_lock');
    expect(rpc).toContain('external_contact_not_allowed');
  });

  it('covers migrated secondary services with explicit Supabase contracts', () => {
    expect(systemNotifications).toContain('public.create_system_notification');
    expect(chatStates).toContain('public.room_states');
    expect(reportsModeration).toContain('public.admin_update_report_status');
    expect(events).toContain('public.events');
    expect(events).toContain('public.event_attendees');
    expect(verification).toContain('public.record_user_connection');
    expect(rewards).toContain('public.admin_create_reward');
    expect(activityRanking).toContain('public.get_top_20_active_users');
    expect(tickets).toContain('public.send_ticket_message');
    expect(analytics).toContain('public.record_analytics_event');
    expect(dailyLimits).toContain('public.increment_my_daily_limit');
    expect(esencias).toContain('public.esencias');
    expect(forum).toContain('public.toggle_forum_vote');
    expect(forum).toContain('public.increment_forum_view');
    expect(contactSafety).toContain('public.record_contact_safety_event');
    expect(contactSafety).toContain("- 'phone'");
    expect(badges).toContain('public.increment_my_event_participation');
    expect(badges).toContain("badge text not null default 'Nuevo'");
    expect(featuredAds).toContain('public.featured_ads');
    expect(featuredAds).toContain('public.record_featured_ad_click');
    expect(baulMediaPaths).toContain('foto_path text');
    expect(baulMediaPaths).toContain("foto_bucket = 'card-media'");
  });

  it('persists public and private replies and protects profile system fields', () => {
    expect(chatRepliesProfileGuards).toContain('add column if not exists reply_to jsonb');
    expect(chatRepliesProfileGuards).toContain('messages_reply_to_shape_check');
    expect(chatRepliesProfileGuards).toContain('jsonb_typeof(reply_to) = \'object\'');
    expect(chatRepliesProfileGuards).toContain('system_profile_fields_are_server_owned');
    expect(chatRepliesProfileGuards).toContain('events_participated');
    expect(privateRepliesRpc).toContain('target_reply_to jsonb');
    expect(privateRepliesRpc).toContain('normalized_reply');
    expect(privateRepliesRpc).toContain('private_message_receipts');
    expect(securityDefinerGrants).toContain('revoke all on function public.send_private_message');
    expect(securityDefinerGrants).toContain('revoke all on function public.admin_create_reward');
    expect(securityDefinerGrants).toContain('grant execute on function public.increment_forum_view(uuid) to anon, authenticated');
    expect(ticketLogHardening).toContain('public.is_admin_user()');
    expect(privateRequestNotificationState).toContain('private_request_notification_state');
    expect(privateRequestNotificationState).toContain("entity_type = 'private_request'");
    expect(explicitTableGrants).toContain('revoke all on table public.messages from anon, authenticated;');
    expect(explicitTableGrants).toContain('grant select on table public.messages to anon, authenticated;');
    expect(explicitTableGrants).toContain('revoke all on table public.private_messages from anon, authenticated;');
  });

  it('maps notification request ids separately from notification ids', () => {
    const privateService = read('src/services/supabasePrivateChatService.js');
    const notificationsPanel = read('src/components/notifications/NotificationsPanel.jsx');
    expect(privateService).toContain('requestId: isRequest ? (row.entity_id || null)');
    expect(privateService).toContain('const targetRequestId = String(requestId ||');
    expect(privateService).toContain('private_message_id');
    expect(privateService).toContain('deliveredTo');
    expect(privateService).toContain('readBy');
    expect(privateService).toContain('replyTo: normalizeReplyTo');
    expect(notificationsPanel).toContain('notification.requestId || notification.entity_id || notification.id');
    expect(privateService).toContain('requestStatus: request?.status || null');
  });

  it('routes moderation and admin public-chat writes through Supabase RPCs', () => {
    expect(moderationRpc).toContain('public.get_my_moderation_state');
    expect(moderationRpc).toContain('public.record_moderation_violation');
    expect(moderationRpc).toContain('public.record_moderation_event');
    expect(moderationRpc).toContain('public.admin_revoke_moderation_action');
    expect(publicChatModeration).toContain('public.admin_delete_public_message');
    expect(publicChatModeration).toContain('public.admin_delete_public_messages');
    expect(publicChatModeration).toContain('public.audit_events');
  });

  it('unwraps public sendMessage results and propagates Supabase errors', () => {
    expect(chatService).toContain('const result = await supabaseChatService.sendMessage(roomId');
    expect(chatService).toContain('if (result?.error) throw result.error;');
    expect(chatService).toContain('return result?.message || null;');
  });

  it('keeps RewardInbox on the active auth provider', () => {
    expect(app).toContain('isSupabaseAuthEnabled() || !user?.id');
    expect(app).toContain('if (!isSupabaseAuthEnabled()) {');
    expect(rewardsService).toContain('if (isSupabaseAuthEnabled()) {');
  });

  it('keeps the public-photo contract consistent end to end', () => {
    expect(chatInput).toContain('uploadPublicChatPhotoToSupabase');
    expect(read('src/services/supabaseMediaService.js')).toContain('const publicBucket = bucket === SUPABASE_MEDIA_BUCKETS.avatars;');
    expect(chatInput).toContain('path: uploaded.path');
    expect(chatPage).toContain('Array.isArray(options?.media)');
    expect(chatPage).toContain('media: messageMedia');
    expect(read('src/services/contactSafetyTelemetryService.js')).toContain("record_contact_safety_event");
    expect(publicChatService).toContain('Array.isArray(messageData.media)');
    expect(publicChatService).toContain('refreshSignedMediaUrl');
    expect(publicChatService).toContain("content: 'Imagen'");
    expect(tarjetaEditor).toContain('uploadSupabaseMedia');
    expect(tarjetaEditor).toContain('SUPABASE_MEDIA_BUCKETS.card');
    expect(tarjetaEditor).toContain('pathPrefixIncludesUser: true');
    expect(baulPromo).toContain("supabase.from('room_presence')");
    expect(baulPromo).toContain("supabase.from('baul_cards')");
  });

  it('does not contain private keys, service-role keys or Firebase service-account JSON', () => {
    expect(allSql).not.toMatch(/BEGIN (?:RSA )?PRIVATE KEY|client_email\s*[:=]|firebase-service\.json/i);
    expect(allSql).not.toMatch(/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/);
  });
});
