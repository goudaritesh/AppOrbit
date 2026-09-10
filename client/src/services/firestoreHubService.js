import {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
} from '../config/firebase';

/**
 * Cloud Firestore Application Hub Service
 * Manages apps, categories, reviews, and real-time synchronization for AppOrbit Hub.
 */

const APPS_COLLECTION = 'apps';
const REVIEWS_COLLECTION = 'reviews';

/**
 * Fetch published applications from Firestore Application Hub
 * @param {object} options - { category, search, sortBy, limitCount }
 * @returns {Promise<Array<object>>}
 */
export async function getHubApps(options = {}) {
  const { category, sortBy = 'createdAt', limitCount = 50 } = options;
  const appsRef = collection(db, APPS_COLLECTION);

  let q = query(appsRef);

  if (category && category !== 'All' && category !== 'all') {
    q = query(q, where('category', '==', category));
  }

  q = query(q, limit(limitCount));

  const querySnapshot = await getDocs(q);
  const apps = [];
  querySnapshot.forEach((docSnap) => {
    apps.push({
      id: docSnap.id,
      ...docSnap.data(),
    });
  });

  return apps;
}

/**
 * Fetch a single application by its Firestore document ID
 * @param {string} appId
 * @returns {Promise<object|null>}
 */
export async function getHubAppById(appId) {
  const docRef = doc(db, APPS_COLLECTION, appId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  };
}

/**
 * Publish a new application to the Firestore Application Hub
 * @param {object} appData
 * @param {object} author - { uid, name, email }
 * @returns {Promise<object>}
 */
export async function publishHubApp(appData, author) {
  const appsRef = collection(db, APPS_COLLECTION);

  const newApp = {
    title: appData.title || appData.name,
    name: appData.name || appData.title,
    packageName: appData.packageName || `com.apporbit.${Date.now()}`,
    description: appData.description || 'No description provided.',
    shortDescription: appData.shortDescription || (appData.description ? appData.description.slice(0, 100) : ''),
    category: appData.category || 'Productivity',
    version: appData.version || '1.0.0',
    iconUrl: appData.iconUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80',
    bannerUrl: appData.bannerUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    downloadUrl: appData.downloadUrl || '',
    apkSize: appData.apkSize || '15 MB',
    rating: typeof appData.rating === 'number' ? appData.rating : 4.8,
    ratingCount: appData.ratingCount || 1,
    downloads: appData.downloads || 0,
    status: 'published',
    developerId: author?.uid || author?.id || 'anonymous',
    developerName: author?.name || author?.displayName || author?.email || 'AppOrbit Developer',
    features: Array.isArray(appData.features) ? appData.features : ['Modern UI', 'Secure Architecture', 'Cloud Sync'],
    screenshots: Array.isArray(appData.screenshots) ? appData.screenshots : [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(appsRef, newApp);

  return {
    id: docRef.id,
    ...newApp,
  };
}

/**
 * Update an existing Application in the Firestore Application Hub
 * @param {string} appId
 * @param {object} updates
 * @returns {Promise<void>}
 */
export async function updateHubApp(appId, updates) {
  const docRef = doc(db, APPS_COLLECTION, appId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete an Application from the Firestore Application Hub
 * @param {string} appId
 * @returns {Promise<void>}
 */
export async function deleteHubApp(appId) {
  const docRef = doc(db, APPS_COLLECTION, appId);
  await deleteDoc(docRef);
}

/**
 * Subscribe to real-time Application Hub updates via Firestore onSnapshot
 * @param {function} callback - Receives array of applications
 * @param {string} [category] - Optional category filter
 * @returns {function} unsubscribe function
 */
export function subscribeToHubApps(callback, category) {
  const appsRef = collection(db, APPS_COLLECTION);
  let q = query(appsRef, limit(50));

  if (category && category !== 'All' && category !== 'all') {
    q = query(q, where('category', '==', category));
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const apps = [];
      snapshot.forEach((docSnap) => {
        apps.push({
          id: docSnap.id,
          ...docSnap.data(),
        });
      });
      callback(apps);
    },
    (error) => {
      console.warn('[Firestore Hub] Real-time subscription error:', error.message);
    }
  );
}

/**
 * Submit a review for an Application in the Firestore Application Hub
 * @param {string} appId
 * @param {object} reviewData - { rating, comment, title }
 * @param {object} user - { uid, name, email }
 * @returns {Promise<object>}
 */
export async function submitHubReview(appId, reviewData, user) {
  const reviewsRef = collection(db, REVIEWS_COLLECTION);

  const reviewDoc = {
    appId,
    userId: user.uid || user.id,
    userName: user.name || user.displayName || 'AppOrbit User',
    userEmail: user.email,
    rating: Number(reviewData.rating) || 5,
    title: reviewData.title || '',
    comment: reviewData.comment || '',
    createdAt: serverTimestamp(),
  };

  const reviewRef = await addDoc(reviewsRef, reviewDoc);

  // Update app rating aggregates
  try {
    const appRef = doc(db, APPS_COLLECTION, appId);
    const appSnap = await getDoc(appRef);
    if (appSnap.exists()) {
      const appData = appSnap.data();
      const currentRating = appData.rating || 5;
      const currentCount = appData.ratingCount || 1;
      const newCount = currentCount + 1;
      const newRating = Number(((currentRating * currentCount + reviewDoc.rating) / newCount).toFixed(1));

      await updateDoc(appRef, {
        rating: newRating,
        ratingCount: newCount,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.warn('[Firestore Hub] Could not update app rating aggregates:', err.message);
  }

  return {
    id: reviewRef.id,
    ...reviewDoc,
  };
}

/**
 * Fetch reviews for an Application
 * @param {string} appId
 * @returns {Promise<Array<object>>}
 */
export async function getHubAppReviews(appId) {
  const reviewsRef = collection(db, REVIEWS_COLLECTION);
  const q = query(reviewsRef, where('appId', '==', appId), limit(20));
  const snap = await getDocs(q);

  const reviews = [];
  snap.forEach((d) => {
    reviews.push({ id: d.id, ...d.data() });
  });

  return reviews;
}
