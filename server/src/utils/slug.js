/**
 * Slug Utility Module (Phase 4 Safe Slug Generation)
 * Provides deterministic and collision-safe slug creation for applications and categories.
 */

/**
 * Generates a URL-safe lowercase slug from any string.
 *
 * @param {string} text
 * @returns {string} Safe slug
 */
export const slugify = (text) => {
  if (!text) return 'app';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') || 'app'; // Trim - from end of text
};

/**
 * Generates a unique collision-safe slug for a given Mongoose model.
 * If 'pulseguard' already exists, tests 'pulseguard-2', 'pulseguard-3', etc.
 *
 * @param {Model} Model - Mongoose model to query
 * @param {string} name - Desired application or resource name
 * @param {string|ObjectId} [currentId=null] - Optional ID of document being updated
 * @returns {Promise<string>} Unique slug
 */
export const generateUniqueSlug = async (Model, name, currentId = null) => {
  const baseSlug = slugify(name);
  let slugCandidate = baseSlug;
  let counter = 1;

  while (true) {
    const query = { slug: slugCandidate };
    if (currentId) {
      query._id = { $ne: currentId };
    }

    const existing = await Model.findOne(query).select('_id').lean();
    if (!existing) {
      return slugCandidate;
    }

    counter++;
    slugCandidate = `${baseSlug}-${counter}`;
  }
};

export default slugify;
