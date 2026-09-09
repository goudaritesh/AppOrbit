import mongoose from 'mongoose';

/**
 * Search History Model (Phase 9 Advanced Discovery)
 * Records user-specific search history and aggregate trending search queries.
 */
const searchHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    query: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Search query cannot exceed 100 characters'],
    },
  },
  {
    timestamps: true,
  }
);

searchHistorySchema.index({ user: 1, createdAt: -1 });
searchHistorySchema.index({ query: 1, createdAt: -1 });

export const SearchHistory = mongoose.model('SearchHistory', searchHistorySchema);
export default SearchHistory;
