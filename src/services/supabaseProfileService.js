import { supabase } from '@/config/supabase';

const PROFILE_FIELDS = [
  'username',
  'email',
  'avatar_url',
  'display_name',
  'bio',
  'age',
  'profile_role',
  'comuna',
  'is_guest',
  'is_premium',
  'verified',
  'role',
  'profile_visible',
  'community_policy_accepted_at',
  'community_policy_version',
  'created_at',
  'updated_at',
];

const ensureClient = () => {
  if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
  return supabase;
};

const cleanText = (value, maxLength) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text.slice(0, maxLength) : null;
};

const toBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  return fallback;
};

export const mapSupabaseProfileToAppUser = (authUser, profile = {}) => {
  const metadata = authUser?.user_metadata || {};
  const row = profile || {};
  const id = authUser?.id || row.id;
  if (!id) return null;

  return {
    id,
    uid: id,
    username: row.username || metadata.username || `Usuario${String(id).replaceAll('-', '').slice(0, 6)}`,
    email: authUser?.email || row.email || '',
    avatar: row.avatar_url || metadata.avatar_url || metadata.avatar || null,
    displayName: row.display_name || metadata.display_name || row.username || metadata.username || null,
    bio: row.bio || null,
    edad: row.age ?? metadata.age ?? null,
    age: row.age ?? metadata.age ?? null,
    profileRole: row.profile_role || metadata.profile_role || null,
    comuna: row.comuna || metadata.comuna || null,
    isGuest: toBoolean(row.is_guest, Boolean(authUser?.is_anonymous)),
    isAnonymous: Boolean(authUser?.is_anonymous),
    isPremium: toBoolean(row.is_premium, false),
    verified: toBoolean(row.verified, false),
    role: row.role || 'user',
    isAdmin: row.role === 'admin',
    profileVisible: row.profile_visible !== false,
    phone: row.phone || null,
    quickPhrases: Array.isArray(row.quick_phrases) ? row.quick_phrases : [],
    theme: row.theme && typeof row.theme === 'object' ? row.theme : {},
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
    communityPolicyAccepted: Boolean(row.community_policy_accepted_at || metadata.community_policy_accepted),
    communityPolicyVersion: row.community_policy_version || metadata.community_policy_version || null,
    _authProvider: 'supabase',
  };
};

const pickProfileFields = (updates = {}) => {
  const map = {
    username: 'username',
    email: 'email',
    avatar: 'avatar_url',
    avatar_url: 'avatar_url',
    displayName: 'display_name',
    display_name: 'display_name',
    bio: 'bio',
    edad: 'age',
    age: 'age',
    profileRole: 'profile_role',
    profile_role: 'profile_role',
    comuna: 'comuna',
    isGuest: 'is_guest',
    is_guest: 'is_guest',
    profileVisible: 'profile_visible',
    profile_visible: 'profile_visible',
    communityPolicyAcceptedAt: 'community_policy_accepted_at',
    community_policy_accepted_at: 'community_policy_accepted_at',
    communityPolicyVersion: 'community_policy_version',
    community_policy_version: 'community_policy_version',
  };
  const result = {};
  Object.entries(updates).forEach(([key, value]) => {
    const target = map[key];
    if (!target || PROFILE_FIELDS.indexOf(target) === -1) return;
    if (['username', 'display_name', 'bio', 'profile_role', 'comuna', 'community_policy_version'].includes(target)) {
      const limits = {
        username: 40,
        display_name: 120,
        bio: 800,
        profile_role: 40,
        comuna: 80,
        community_policy_version: 40,
      };
      result[target] = cleanText(value, limits[target]);
      return;
    }
    if (target === 'age') {
      const numeric = value === null || value === '' ? null : Number(value);
      if (numeric !== null && (!Number.isInteger(numeric) || numeric < 18 || numeric > 120)) {
        throw new Error('INVALID_PROFILE_AGE');
      }
      result[target] = numeric;
      return;
    }
    if (target === 'avatar_url') {
      result[target] = value === null || value === '' ? null : String(value).slice(0, 1000);
      return;
    }
    if (['is_guest', 'profile_visible'].includes(target)) {
      result[target] = Boolean(value);
      return;
    }
    result[target] = value;
  });
  return result;
};

export const getSupabaseProfile = async (userId) => {
  const client = ensureClient();
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const ensureSupabaseProfile = async (authUser, profileUpdates = {}) => {
  const client = ensureClient();
  if (!authUser?.id) throw new Error('SUPABASE_AUTH_USER_MISSING');
  const existing = await getSupabaseProfile(authUser.id);
  if (existing) return existing;

  const metadata = authUser.user_metadata || {};
  const insert = {
    id: authUser.id,
    username: cleanText(profileUpdates.username || metadata.username || `Usuario${authUser.id.replaceAll('-', '').slice(0, 6)}`, 40),
    email: authUser.email || null,
    display_name: cleanText(profileUpdates.displayName || metadata.display_name, 120),
    profile_role: cleanText(profileUpdates.profileRole || metadata.profile_role, 40),
    comuna: cleanText(profileUpdates.comuna || metadata.comuna, 80),
    age: profileUpdates.age || metadata.age ? Number(profileUpdates.age || metadata.age) : null,
    avatar_url: profileUpdates.avatar || metadata.avatar_url || metadata.avatar || null,
    is_guest: Boolean(authUser.is_anonymous),
    community_policy_accepted_at: profileUpdates.communityPolicyAccepted ? new Date().toISOString() : null,
    community_policy_version: cleanText(profileUpdates.communityPolicyVersion || metadata.community_policy_version, 40),
  };
  const { data, error } = await client
    .from('profiles')
    .insert(insert)
    .select('*')
    .single();
  if (error) throw error;
  return data;
};

export const getSupabasePrivateContact = async (userId) => {
  const client = ensureClient();
  const { data, error } = await client.from('profile_private_contacts').select('phone').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data;
};

export const updateSupabasePrivateContact = async (userId, phone) => {
  const client = ensureClient();
  const normalized = String(phone || '').trim().slice(0, 40);
  if (!normalized || normalized.length < 3) {
    const { error } = await client.from('profile_private_contacts').delete().eq('user_id', userId);
    if (error) throw error;
    return null;
  }
  const { data, error } = await client.from('profile_private_contacts').upsert({ user_id: userId, phone: normalized }, { onConflict: 'user_id' }).select('phone').single();
  if (error) throw error;
  return data;
};

export const updateSupabaseProfile = async (userId, updates) => {
  const client = ensureClient();
  const patch = pickProfileFields(updates);
  const hasPrivatePhoneUpdate = Object.prototype.hasOwnProperty.call(updates || {}, 'phone');
  if (Object.keys(patch).length === 0 && !hasPrivatePhoneUpdate) return getSupabaseProfile(userId);
  let data;
  if (Object.keys(patch).length > 0) {
    const result = await client.from('profiles').update(patch).eq('id', userId).select('*').single();
    if (result.error) throw result.error;
    data = result.data;
  } else {
    data = await getSupabaseProfile(userId);
  }
  if (!data) throw new Error('PROFILE_NOT_FOUND');
  if (hasPrivatePhoneUpdate) {
    const privateContact = await updateSupabasePrivateContact(userId, updates.phone);
    return { ...data, phone: privateContact?.phone || null };
  }
  return data;
};

export const subscribeToSupabaseProfile = (userId, callback) => {
  const client = ensureClient();
  let active = true;
  getSupabaseProfile(userId)
    .then((profile) => {
      if (active && profile) callback(profile);
    })
    .catch(() => {});

  const channel = client
    .channel(`profile:${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'profiles',
      filter: `id=eq.${userId}`,
    }, (payload) => {
      if (active && payload?.new) callback(payload.new);
    })
    .subscribe();

  return () => {
    active = false;
    client.removeChannel(channel);
  };
};

export const updateSupabasePreferences = async (userId, preferencesPatch = {}) => {
  const client = ensureClient();
  const { data: current, error: currentError } = await client
    .from('user_preferences')
    .select('preferences')
    .eq('user_id', userId)
    .maybeSingle();
  if (currentError) throw currentError;
  const nextPreferences = {
    ...(current?.preferences && typeof current.preferences === 'object' ? current.preferences : {}),
    ...preferencesPatch,
  };
  const { error } = await client
    .from('user_preferences')
    .upsert({ user_id: userId, preferences: nextPreferences }, { onConflict: 'user_id' });
  if (error) throw error;
  return nextPreferences;
};
