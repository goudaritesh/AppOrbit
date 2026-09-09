import mongoose from 'mongoose';

/**
 * Category Schema (Phase 3 Production Implementation)
 * Scalable categorization system for Android applications.
 */
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      maxlength: [60, 'Category name cannot exceed 60 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Category slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters'],
      default: '',
    },
    icon: {
      type: String,
      default: '📱',
      trim: true,
    },
    image: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['ACTIVE', 'INACTIVE'],
        message: '{VALUE} is not a valid category status',
      },
      default: 'ACTIVE',
      index: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    appCount: {
      type: Number,
      default: 0,
      min: [0, 'App count cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying active categories sorted by order
categorySchema.index({ status: 1, order: 1 });

export const Category = mongoose.model('Category', categorySchema);
export default Category;
