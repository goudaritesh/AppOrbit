import AppVersion from '../models/AppVersion.js';

class GlobalQuotaService {
  constructor() {
    // 10 GB in bytes
    this.MAX_STORAGE_BYTES = 10 * 1024 * 1024 * 1024;
    
    // In-memory cache to prevent DB spam on concurrent uploads
    this.cachedTotalSize = 0;
    this.lastCacheTime = 0;
    this.CACHE_TTL_MS = 60000; // 1 minute
  }

  /**
   * Calculates the total storage used by all APKs across the platform
   * @returns {Promise<number>} Total size in bytes
   */
  async getTotalStorageUsed() {
    const now = Date.now();
    
    if (now - this.lastCacheTime < this.CACHE_TTL_MS) {
      return this.cachedTotalSize;
    }

    try {
      const pipeline = [
        {
          $group: {
            _id: null,
            totalSize: { $sum: '$fileSize' }
          }
        }
      ];

      const result = await AppVersion.aggregate(pipeline);
      
      this.cachedTotalSize = result.length > 0 ? (result[0].totalSize || 0) : 0;
      this.lastCacheTime = now;
      
      return this.cachedTotalSize;
    } catch (error) {
      console.error('[GlobalQuotaService] Failed to calculate total storage size:', error.message);
      // Fallback to cache if DB aggregate fails momentarily
      return this.cachedTotalSize;
    }
  }

  /**
   * Checks if an incoming file will breach the 10 GB platform limit.
   * Throws an error if the limit is exceeded.
   * @param {number} incomingSizeBytes - The size of the incoming file in bytes
   */
  async checkStorageQuota(incomingSizeBytes) {
    const currentTotal = await this.getTotalStorageUsed();
    
    if ((currentTotal + incomingSizeBytes) > this.MAX_STORAGE_BYTES) {
      const err = new Error('Platform global storage limit (10 GB) exceeded. Please delete old applications or contact the administrator to upgrade storage capacity.');
      err.status = 403;
      err.code = 'QUOTA_EXCEEDED';
      throw err;
    }

    // Optimistically update the cache to prevent race conditions on concurrent uploads
    this.cachedTotalSize += incomingSizeBytes;
    return true;
  }
}

export const globalQuotaService = new GlobalQuotaService();
export default globalQuotaService;
