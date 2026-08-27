import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { supabase, isSupabaseAuthEnabled } from '@/config/supabase';
import localFeaturedAds from '@/data/featuredChannels.json';
import {
  sanitizeFeaturedAdInput,
  shouldShowBySchedule,
  toDateOrNull,
  validateFeaturedAd,
} from '@/utils/embeds';

const FEATURED_ADS_COLLECTION = 'featured_ads';

const toMillis = (value) => {
  const parsed = toDateOrNull(value);
  return parsed ? parsed.getTime() : null;
};

const normalizeSupabaseAd = (row) => normalizeDoc({ id: row.id, data: () => ({ ...row, ctaText: row.cta_text, mediaType: row.media_type, mediaUrl: row.media_url, blurEnabled: row.blur_enabled, blurStrength: row.blur_strength, isActive: row.is_active, sortOrder: row.sort_order, startsAt: row.starts_at, endsAt: row.ends_at, clickCount: row.click_count, createdAt: row.created_at, updatedAt: row.updated_at }) });

const normalizeDoc = (docSnap) => {
  const data = docSnap.data() || {};

  const startsAt = toDateOrNull(data.startsAt ?? data.starts_at);
  const endsAt = toDateOrNull(data.endsAt ?? data.ends_at);
  const createdAt = toDateOrNull(data.createdAt);
  const updatedAt = toDateOrNull(data.updatedAt);

  return {
    id: docSnap.id,
    title: data.title || '',
    description: data.description || '',
    platform: data.platform || 'other',
    ctaText: data.ctaText ?? data.cta_text ?? 'Ver',
    url: data.url || '',
    mediaType: data.mediaType ?? data.media_type ?? 'none',
    mediaUrl: data.mediaUrl ?? data.media_url ?? '',
    blurEnabled: Boolean(data.blurEnabled ?? data.blur_enabled ?? true),
    blurStrength: Number(data.blurStrength ?? data.blur_strength ?? 14) || 14,
    badge: data.badge || null,
    isActive: Boolean(data.isActive ?? data.is_active ?? true),
    sortOrder: Number(data.sortOrder ?? data.sort_order ?? 9999) || 9999,
    startsAt,
    endsAt,
    startsAtMs: toMillis(startsAt),
    endsAtMs: toMillis(endsAt),
    createdAt,
    createdAtMs: toMillis(createdAt),
    updatedAt,
    updatedAtMs: toMillis(updatedAt),
    clickCount: Number(data.clickCount || 0),
    fallback: false,
  };
};

const normalizeLocal = (item) => {
  const normalized = sanitizeFeaturedAdInput(item);
  const now = new Date();

  return {
    id: item.id || `seed_${Math.random().toString(36).slice(2, 8)}`,
    ...normalized,
    startsAt: normalized.startsAt,
    endsAt: normalized.endsAt,
    startsAtMs: toMillis(normalized.startsAt),
    endsAtMs: toMillis(normalized.endsAt),
    createdAt: now,
    createdAtMs: now.getTime(),
    updatedAt: now,
    updatedAtMs: now.getTime(),
    clickCount: 0,
    fallback: true,
  };
};

const byDisplayOrder = (a, b) => {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  return (b.updatedAtMs || 0) - (a.updatedAtMs || 0);
};

const getActiveAds = (ads, nowMs = Date.now()) =>
  ads
    .filter((ad) => ad.isActive && shouldShowBySchedule(ad.startsAt, ad.endsAt, nowMs))
    .sort(byDisplayOrder);

const getFallbackAds = () =>
  localFeaturedAds
    .map(normalizeLocal)
    .filter((ad) => ad.isActive)
    .sort(byDisplayOrder);

const toSupabasePayload = (adInput) => {
  const payload = toFirestorePayload(adInput);
  return { title: payload.title, description: payload.description, platform: payload.platform, cta_text: payload.ctaText, url: payload.url, media_type: payload.mediaType, media_url: payload.mediaUrl || null, blur_enabled: payload.blurEnabled, blur_strength: payload.blurStrength, badge: payload.badge, is_active: payload.isActive, sort_order: payload.sortOrder, starts_at: payload.startsAt, ends_at: payload.endsAt };
};

const toFirestorePayload = (adInput) => {
  const validated = validateFeaturedAd(adInput);
  if (!validated.isValid) {
    throw new Error(validated.errors[0] || 'Datos de anuncio invalidos.');
  }
  const ad = validated.sanitized;
  return {
    title: ad.title,
    description: ad.description,
    platform: ad.platform,
    ctaText: ad.ctaText,
    url: ad.url,
    mediaType: ad.mediaType,
    mediaUrl: ad.mediaUrl,
    blurEnabled: ad.blurEnabled,
    blurStrength: ad.blurStrength,
    badge: ad.badge,
    isActive: ad.isActive,
    sortOrder: ad.sortOrder,
    startsAt: ad.startsAt || null,
    endsAt: ad.endsAt || null,
  };
};

export const subscribeFeaturedAdsPublic = (onUpdate, onError) => {
  if (typeof onUpdate !== 'function') {
    throw new Error('subscribeFeaturedAdsPublic requiere onUpdate callback.');
  }
  if (isSupabaseAuthEnabled()) {
    let active = true;
    const load = async () => { try { const { data, error } = await supabase.from('featured_ads').select('*').eq('is_active', true).order('sort_order', { ascending: true }); if (error) throw error; const ads = (data || []).map(normalizeSupabaseAd).filter((ad) => shouldShowBySchedule(ad.startsAt, ad.endsAt)); if (active) onUpdate(ads); } catch (error) { onError?.(error); if (active) onUpdate([]); } };
    void load();
    const channel = supabase.channel('featured-ads-public').on('postgres_changes', { event: '*', schema: 'public', table: 'featured_ads' }, () => { void load(); }).subscribe();
    return () => { active = false; void supabase.removeChannel(channel); };
  }

  const adsRef = collection(db, FEATURED_ADS_COLLECTION);
  const adsQuery = query(adsRef, orderBy('sortOrder', 'asc'));

  return onSnapshot(
    adsQuery,
    (snapshot) => {
      const allAds = snapshot.docs.map(normalizeDoc).sort(byDisplayOrder);
      const activeAds = getActiveAds(allAds);
      onUpdate(activeAds.length > 0 ? activeAds : getFallbackAds());
    },
    (error) => {
      console.error('[FEATURED_ADS] Error en suscripcion publica:', error);
      onUpdate(getFallbackAds());
      if (typeof onError === 'function') onError(error);
    }
  );
};

export const subscribeFeaturedAdsAdmin = (onUpdate, onError) => {
  if (typeof onUpdate !== 'function') {
    throw new Error('subscribeFeaturedAdsAdmin requiere onUpdate callback.');
  }
  if (isSupabaseAuthEnabled()) {
    let active = true;
    const load = async () => { try { const { data, error } = await supabase.from('featured_ads').select('*').order('sort_order', { ascending: true }); if (error) throw error; if (active) onUpdate((data || []).map(normalizeSupabaseAd).sort(byDisplayOrder)); } catch (error) { onError?.(error); } };
    void load();
    const channel = supabase.channel('featured-ads-admin').on('postgres_changes', { event: '*', schema: 'public', table: 'featured_ads' }, () => { void load(); }).subscribe();
    return () => { active = false; void supabase.removeChannel(channel); };
  }

  const adsRef = collection(db, FEATURED_ADS_COLLECTION);
  const adsQuery = query(adsRef, orderBy('sortOrder', 'asc'));

  return onSnapshot(
    adsQuery,
    (snapshot) => {
      const ads = snapshot.docs.map(normalizeDoc).sort(byDisplayOrder);
      onUpdate(ads);
    },
    (error) => {
      console.error('[FEATURED_ADS] Error en suscripcion admin:', error);
      if (typeof onError === 'function') onError(error);
    }
  );
};

export const createFeaturedAd = async (adInput) => {
  const payload = toFirestorePayload(adInput);
  if (isSupabaseAuthEnabled()) {
    const { data: authData } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('featured_ads').insert({ ...toSupabasePayload(adInput), created_by: authData?.user?.id || null }).select('id').single();
    if (error) throw error;
    return data.id;
  }
  const adsRef = collection(db, FEATURED_ADS_COLLECTION);
  const createdRef = await addDoc(adsRef, {
    ...payload,
    clickCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return createdRef.id;
};

export const updateFeaturedAd = async (adId, adInput) => {
  if (!adId) throw new Error('ID de anuncio invalido.');
  const payload = toFirestorePayload(adInput);
  if (isSupabaseAuthEnabled()) {
    const { error } = await supabase.from('featured_ads').update(toSupabasePayload(adInput)).eq('id', adId);
    if (error) throw error;
    return;
  }
  const adRef = doc(db, FEATURED_ADS_COLLECTION, adId);
  await updateDoc(adRef, {
    ...payload,
    updatedAt: serverTimestamp(),
  });
};

export const deleteFeaturedAd = async (adId) => {
  if (!adId) throw new Error('ID de anuncio invalido.');
  if (isSupabaseAuthEnabled()) { const { error } = await supabase.from('featured_ads').delete().eq('id', adId); if (error) throw error; return; }
  await deleteDoc(doc(db, FEATURED_ADS_COLLECTION, adId));
};

export const toggleFeaturedAdActive = async (adId, isActive) => {
  if (!adId) throw new Error('ID de anuncio invalido.');
  if (isSupabaseAuthEnabled()) { const { error } = await supabase.from('featured_ads').update({ is_active: Boolean(isActive) }).eq('id', adId); if (error) throw error; return; }
  await updateDoc(doc(db, FEATURED_ADS_COLLECTION, adId), {
    isActive: Boolean(isActive),
    updatedAt: serverTimestamp(),
  });
};

export const reorderFeaturedAds = async (orderedIds = []) => {
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) return;
  if (isSupabaseAuthEnabled()) {
    for (const [index, id] of orderedIds.entries()) { const { error } = await supabase.from('featured_ads').update({ sort_order: index + 1 }).eq('id', id); if (error) throw error; }
    return;
  }
  const batch = writeBatch(db);
  orderedIds.forEach((id, index) => {
    const adRef = doc(db, FEATURED_ADS_COLLECTION, id);
    batch.update(adRef, {
      sortOrder: index + 1,
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
};

export const normalizeReorderedAds = (ads, draggedId, targetId) => {
  if (!draggedId || !targetId || draggedId === targetId) return ads;
  const current = [...ads];
  const fromIndex = current.findIndex((ad) => ad.id === draggedId);
  const toIndex = current.findIndex((ad) => ad.id === targetId);
  if (fromIndex < 0 || toIndex < 0) return ads;
  const [dragged] = current.splice(fromIndex, 1);
  current.splice(toIndex, 0, dragged);
  return current.map((ad, index) => ({
    ...ad,
    sortOrder: index + 1,
  }));
};

export const ensureSortOrderForAds = async () => {
  if (isSupabaseAuthEnabled()) {
    const { data, error } = await supabase.from('featured_ads').select('id,sort_order').order('sort_order', { ascending: true }); if (error) throw error;
    for (const [index, ad] of (data || []).entries()) { if (ad.sort_order !== index + 1) { const result = await supabase.from('featured_ads').update({ sort_order: index + 1 }).eq('id', ad.id); if (result.error) throw result.error; } }
    return;
  }
  const adsRef = collection(db, FEATURED_ADS_COLLECTION);
  const snapshot = await getDocs(query(adsRef, orderBy('sortOrder', 'asc')));
  const ads = snapshot.docs.map(normalizeDoc).sort(byDisplayOrder);
  const batch = writeBatch(db);
  let needsUpdate = false;
  ads.forEach((ad, index) => {
    const expectedOrder = index + 1;
    if (ad.sortOrder !== expectedOrder) {
      needsUpdate = true;
      batch.update(doc(db, FEATURED_ADS_COLLECTION, ad.id), {
        sortOrder: expectedOrder,
        updatedAt: serverTimestamp(),
      });
    }
  });
  if (needsUpdate) {
    await batch.commit();
  }
};

export const trackFeaturedAdClick = async (adId) => {
  if (!adId) return;
  if (isSupabaseAuthEnabled()) { const { error } = await supabase.rpc('record_featured_ad_click', { target_ad_id: adId }); if (error) console.warn('[FEATURED_ADS] No se pudo registrar click Supabase:', error.message); return; }
  try {
    await updateDoc(doc(db, FEATURED_ADS_COLLECTION, adId), {
      clickCount: increment(1),
      lastClickedAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn('[FEATURED_ADS] No se pudo registrar click:', error);
  }
};

export const getFeaturedAdsFallback = () => getFallbackAds();

