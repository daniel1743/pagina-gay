import { COMMUNITY_POLICY_STORAGE, COMMUNITY_POLICY_VERSION } from '@/content/communityPolicy';

const normalizeIdentityValue = (value) => String(value || '').trim().toLowerCase();

const readStorage = (storage, key) => {
  if (!storage || !key) return null;
  try {
    return storage.getItem(key);
  } catch (error) {
    return null;
  }
};

const writeStorage = (storage, key, value) => {
  if (!storage || !key) return;
  try {
    storage.setItem(key, value);
  } catch (error) {
    // noop
  }
};

export const getStoredVerifiedAge = ({ userId = null, username = null, fallbackAge = null } = {}) => {
  if (typeof window === 'undefined') return null;

  const normalizedUsername = normalizeIdentityValue(username);
  const candidates = [
    userId ? `age_verified_${userId}` : null,
    normalizedUsername ? `age_verified_${normalizedUsername}` : null,
  ].filter(Boolean);

  for (const key of candidates) {
    const rawValue = readStorage(window.localStorage, key);
    const parsedAge = Number.parseInt(rawValue, 10);
    if (Number.isFinite(parsedAge)) {
      return parsedAge;
    }
  }

  const parsedFallbackAge = Number.parseInt(fallbackAge, 10);
  if (Number.isFinite(parsedFallbackAge)) {
    return parsedFallbackAge;
  }

  return null;
};

export const hasAcceptedCommunityPolicyLocally = ({ userId = null, username = null, profileAccepted = false } = {}) => {
  if (profileAccepted) return true;
  if (typeof window === 'undefined') return false;

  const normalizedUsername = normalizeIdentityValue(username);
  const userAccepted = [
    userId ? `rules_accepted_${userId}` : null,
    normalizedUsername ? `rules_accepted_${normalizedUsername}` : null,
  ]
    .filter(Boolean)
    .some((key) => readStorage(window.localStorage, key) === 'true' || readStorage(window.sessionStorage, key) === 'true');

  const globalAccepted = readStorage(window.localStorage, COMMUNITY_POLICY_STORAGE.acceptedFlag) === '1';
  const storedVersion = readStorage(window.localStorage, COMMUNITY_POLICY_STORAGE.version);

  return userAccepted && globalAccepted && storedVersion === COMMUNITY_POLICY_VERSION;
};

export const hasValidGuestCommunityAccess = ({
  userId = null,
  username = null,
  fallbackAge = null,
  profileAccepted = false,
} = {}) => {
  const verifiedAge = getStoredVerifiedAge({ userId, username, fallbackAge });
  return Number.isFinite(verifiedAge)
    && verifiedAge >= 18
    && verifiedAge <= 120
    && hasAcceptedCommunityPolicyLocally({ userId, username, profileAccepted });
};

export const syncGuestCommunityAccess = ({ userId = null, username = null, fallbackAge = null } = {}) => {
  if (typeof window === 'undefined' || !userId) return;

  const verifiedAge = getStoredVerifiedAge({ userId, username, fallbackAge });
  if (Number.isFinite(verifiedAge)) {
    writeStorage(window.localStorage, `age_verified_${userId}`, String(verifiedAge));
  }

  if (hasAcceptedCommunityPolicyLocally({ userId, username })) {
    writeStorage(window.localStorage, `rules_accepted_${userId}`, 'true');
    writeStorage(window.localStorage, COMMUNITY_POLICY_STORAGE.acceptedFlag, '1');
    writeStorage(window.localStorage, COMMUNITY_POLICY_STORAGE.acceptedAt, String(Date.now()));
    writeStorage(window.localStorage, COMMUNITY_POLICY_STORAGE.version, COMMUNITY_POLICY_VERSION);
  }
};
