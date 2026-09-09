import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import reviewsApi from '../../api/reviewsApi';

export const fetchAppReviews = createAsyncThunk(
  'reviews/fetchAppReviews',
  async ({ appId, params }, { rejectWithValue }) => {
    try {
      const response = await reviewsApi.getAppReviews(appId, params);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch reviews');
    }
  }
);

export const submitReview = createAsyncThunk(
  'reviews/submitReview',
  async ({ appId, data }, { rejectWithValue }) => {
    try {
      const response = await reviewsApi.createReview(appId, data);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to submit review');
    }
  }
);

export const updateReview = createAsyncThunk(
  'reviews/updateReview',
  async ({ reviewId, data }, { rejectWithValue }) => {
    try {
      const response = await reviewsApi.updateReview(reviewId, data);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update review');
    }
  }
);

export const deleteReview = createAsyncThunk(
  'reviews/deleteReview',
  async (reviewId, { rejectWithValue }) => {
    try {
      await reviewsApi.deleteReview(reviewId);
      return reviewId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete review');
    }
  }
);

export const toggleHelpfulVote = createAsyncThunk(
  'reviews/toggleHelpfulVote',
  async ({ reviewId, hasVoted }, { rejectWithValue }) => {
    try {
      if (hasVoted) {
        const response = await reviewsApi.unvoteHelpful(reviewId);
        return { reviewId, ...response.data.data };
      } else {
        const response = await reviewsApi.voteHelpful(reviewId);
        return { reviewId, ...response.data.data };
      }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to vote review');
    }
  }
);

const reviewSlice = createSlice({
  name: 'reviews',
  initialState: {
    items: [],
    pagination: { page: 1, limit: 10, total: 0, pages: 1 },
    ratingSummary: { ratingAverage: 0, ratingCount: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
    userReview: null,
    loading: false,
    submitting: false,
    error: null,
  },
  reducers: {
    clearReviews: (state) => {
      state.items = [];
      state.userReview = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Reviews
      .addCase(fetchAppReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAppReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.reviews || [];
        state.pagination = action.payload.pagination;
        state.ratingSummary = action.payload.ratingSummary;
        state.userReview = action.payload.userReview;
      })
      .addCase(fetchAppReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Submit Review
      .addCase(submitReview.pending, (state) => {
        state.submitting = true;
      })
      .addCase(submitReview.fulfilled, (state, action) => {
        state.submitting = false;
        state.items.unshift(action.payload);
        state.userReview = action.payload;
      })
      .addCase(submitReview.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })

      // Update Review
      .addCase(updateReview.fulfilled, (state, action) => {
        state.userReview = action.payload;
        const index = state.items.findIndex((r) => r._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })

      // Delete Review
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.items = state.items.filter((r) => r._id !== action.payload);
        if (state.userReview?._id === action.payload) {
          state.userReview = null;
        }
      })

      // Toggle Helpful
      .addCase(toggleHelpfulVote.fulfilled, (state, action) => {
        const item = state.items.find((r) => r._id === action.payload.reviewId);
        if (item) {
          item.helpfulCount = action.payload.helpfulCount;
          item.hasVotedHelpful = action.payload.hasVotedHelpful;
        }
      });
  },
});

export const { clearReviews } = reviewSlice.actions;
export default reviewSlice.reducer;
