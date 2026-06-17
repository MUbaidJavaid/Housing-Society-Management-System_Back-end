export interface CachedPermissionEntry {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canExport: boolean;
  canImport: boolean;
  canApprove: boolean;
  canVerify: boolean;
}

interface CacheEntry {
  permissions: Map<string, CachedPermissionEntry>; // keyed by moduleCode
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function getCachedPermissions(roleId: string): Map<string, CachedPermissionEntry> | null {
  const entry = cache.get(roleId);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(roleId);
    return null;
  }
  return entry.permissions;
}

export function setCachedPermissions(roleId: string, permissions: Map<string, CachedPermissionEntry>): void {
  cache.set(roleId, { permissions, timestamp: Date.now() });
}

export function invalidatePermissionCache(roleId?: string): void {
  if (roleId) {
    cache.delete(roleId);
  } else {
    cache.clear();
  }
}

export function getCacheStats(): { size: number; keys: string[] } {
  return { size: cache.size, keys: Array.from(cache.keys()) };
}
