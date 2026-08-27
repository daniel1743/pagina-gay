-- Chactivo Supabase-first: explicit table grants derived from policies.
-- Prepared locally only. Do not execute from this task.
-- RLS policies and table privileges are separate controls; revoke implicit client grants first.
revoke all on table public.audit_events from anon, authenticated;
revoke all on table public.baul_footprints from anon, authenticated;
revoke all on table public.baul_impressions from anon, authenticated;
revoke all on table public.baul_likes from anon, authenticated;
revoke all on table public.baul_notes from anon, authenticated;
revoke all on table public.baul_visits from anon, authenticated;
revoke all on table public.media_objects from anon, authenticated;
revoke all on table public.opin_actions from anon, authenticated;
revoke all on table public.user_migration_map from anon, authenticated;

revoke all on table public.analytics_events from anon, authenticated;
grant select on table public.analytics_events to authenticated;

revoke all on table public.baul_cards from anon, authenticated;
grant select on table public.baul_cards to anon;
grant select, insert, update, delete on table public.baul_cards to authenticated;

revoke all on table public.baul_match_reads from anon, authenticated;
grant select on table public.baul_match_reads to authenticated;

revoke all on table public.baul_matches from anon, authenticated;
grant select on table public.baul_matches to authenticated;

revoke all on table public.blocks from anon, authenticated;
grant select, insert, delete on table public.blocks to authenticated;

revoke all on table public.contact_safety_events from anon, authenticated;
grant select on table public.contact_safety_events to authenticated;

revoke all on table public.contact_safety_profiles from anon, authenticated;
grant select on table public.contact_safety_profiles to authenticated;

revoke all on table public.contacts from anon, authenticated;
grant select, insert, update, delete on table public.contacts to authenticated;

revoke all on table public.conversation_members from anon, authenticated;
grant select, insert, update on table public.conversation_members to authenticated;

revoke all on table public.conversations from anon, authenticated;
grant select, insert, update on table public.conversations to authenticated;

revoke all on table public.daily_user_limits from anon, authenticated;
grant select on table public.daily_user_limits to authenticated;

revoke all on table public.esencias from anon, authenticated;
grant select on table public.esencias to anon, authenticated;
grant insert, delete on table public.esencias to authenticated;

revoke all on table public.event_attendees from anon, authenticated;
grant select on table public.event_attendees to anon, authenticated;
grant insert, delete on table public.event_attendees to authenticated;

revoke all on table public.events from anon, authenticated;
grant select on table public.events to anon, authenticated;
grant insert, update, delete on table public.events to authenticated;

revoke all on table public.featured_ads from anon, authenticated;
grant select on table public.featured_ads to anon, authenticated;
grant insert, update, delete on table public.featured_ads to authenticated;

revoke all on table public.forum_replies from anon, authenticated;
grant select on table public.forum_replies to anon, authenticated;
grant insert, update, delete on table public.forum_replies to authenticated;

revoke all on table public.forum_threads from anon, authenticated;
grant select on table public.forum_threads to anon, authenticated;
grant insert, update, delete on table public.forum_threads to authenticated;

revoke all on table public.forum_votes from anon, authenticated;
grant select on table public.forum_votes to authenticated;

revoke all on table public.message_reactions from anon, authenticated;
grant select on table public.message_reactions to anon, authenticated;
grant insert, update, delete on table public.message_reactions to authenticated;

revoke all on table public.message_receipts from anon, authenticated;
grant select, insert, update, delete on table public.message_receipts to authenticated;

revoke all on table public.messages from anon, authenticated;
grant select on table public.messages to anon, authenticated;
grant insert, update, delete on table public.messages to authenticated;

revoke all on table public.moderation_actions from anon, authenticated;
grant select on table public.moderation_actions to authenticated;

revoke all on table public.notifications from anon, authenticated;
grant select, update on table public.notifications to authenticated;

revoke all on table public.opin_comments from anon, authenticated;
grant select on table public.opin_comments to anon, authenticated;
grant insert, update, delete on table public.opin_comments to authenticated;

revoke all on table public.opin_follows from anon, authenticated;
grant select, insert, update, delete on table public.opin_follows to authenticated;

revoke all on table public.opin_likes from anon, authenticated;
grant select, insert, update, delete on table public.opin_likes to authenticated;

revoke all on table public.opin_posts from anon, authenticated;
grant select on table public.opin_posts to anon, authenticated;
grant insert, update, delete on table public.opin_posts to authenticated;

revoke all on table public.opin_reactions from anon, authenticated;
grant select, insert, update, delete on table public.opin_reactions to authenticated;

revoke all on table public.opin_saves from anon, authenticated;
grant select, insert, update, delete on table public.opin_saves to authenticated;

revoke all on table public.private_contact_shares from anon, authenticated;
grant select on table public.private_contact_shares to authenticated;

revoke all on table public.private_message_receipts from anon, authenticated;
grant select on table public.private_message_receipts to authenticated;

revoke all on table public.private_messages from anon, authenticated;
grant select, insert, update, delete on table public.private_messages to authenticated;

revoke all on table public.private_requests from anon, authenticated;
grant select, insert, update on table public.private_requests to authenticated;

revoke all on table public.private_typing from anon, authenticated;
grant select, insert, update, delete on table public.private_typing to authenticated;

revoke all on table public.profile_private_contacts from anon, authenticated;
grant select, insert, update, delete on table public.profile_private_contacts to authenticated;

revoke all on table public.profile_private_settings from anon, authenticated;
grant select, insert, update, delete on table public.profile_private_settings to authenticated;

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to anon, authenticated;
grant insert, update, delete on table public.profiles to authenticated;

revoke all on table public.reports from anon, authenticated;
grant select, insert on table public.reports to authenticated;

revoke all on table public.room_presence from anon, authenticated;
grant select, insert, update, delete on table public.room_presence to authenticated;

revoke all on table public.room_state_reactions from anon, authenticated;
grant select on table public.room_state_reactions to anon, authenticated;
grant insert, update, delete on table public.room_state_reactions to authenticated;

revoke all on table public.room_states from anon, authenticated;
grant select on table public.room_states to anon, authenticated;
grant insert, update, delete on table public.room_states to authenticated;

revoke all on table public.rooms from anon, authenticated;
grant select on table public.rooms to anon, authenticated;

revoke all on table public.saved_profiles from anon, authenticated;
grant select, insert, update, delete on table public.saved_profiles to authenticated;

revoke all on table public.ticket_logs from anon, authenticated;
grant select, insert on table public.ticket_logs to authenticated;

revoke all on table public.ticket_messages from anon, authenticated;
grant select, insert on table public.ticket_messages to authenticated;

revoke all on table public.tickets from anon, authenticated;
grant select, insert, update on table public.tickets to authenticated;

revoke all on table public.user_preferences from anon, authenticated;
grant select, insert, update, delete on table public.user_preferences to authenticated;

revoke all on table public.user_rewards from anon, authenticated;
grant select on table public.user_rewards to authenticated;

revoke all on table public.user_verification from anon, authenticated;
grant select on table public.user_verification to authenticated;
