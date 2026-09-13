import {
  db,
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from '../config/firebase';

const CONVERSATIONS_COLLECTION = 'conversations';

/**
 * Initializes or fetches an existing conversation between a user and a developer.
 */
export const getOrCreateConversation = async (userId, developerId, userName, developerName) => {
  const conversationsRef = collection(db, CONVERSATIONS_COLLECTION);
  
  // Check if conversation exists
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', userId)
  );
  
  const querySnapshot = await getDocs(q);
  let conversationDoc = null;
  
  querySnapshot.forEach((d) => {
    const data = d.data();
    if (data.participants.includes(developerId)) {
      conversationDoc = { id: d.id, ...data };
    }
  });

  if (conversationDoc) {
    return conversationDoc;
  }

  // Create new conversation
  const newConversationRef = doc(conversationsRef);
  const newConversation = {
    participants: [userId, developerId],
    participantNames: {
      [userId]: userName,
      [developerId]: developerName,
    },
    lastMessage: 'Conversation started',
    lastMessageTime: serverTimestamp(),
    createdAt: serverTimestamp(),
  };

  await setDoc(newConversationRef, newConversation);
  return { id: newConversationRef.id, ...newConversation };
};

/**
 * Sends a message in a conversation.
 */
export const sendMessage = async (conversationId, senderId, text) => {
  const messagesRef = collection(db, `${CONVERSATIONS_COLLECTION}/${conversationId}/messages`);
  const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);

  const message = {
    senderId,
    text,
    timestamp: serverTimestamp(),
    read: false,
  };

  await addDoc(messagesRef, message);

  // Update conversation last message
  await updateDoc(conversationRef, {
    lastMessage: text,
    lastMessageTime: serverTimestamp(),
    lastSenderId: senderId,
  });
};

/**
 * Subscribes to all conversations for a specific user.
 */
export const subscribeToConversations = (userId, callback) => {
  const q = query(
    collection(db, CONVERSATIONS_COLLECTION),
    where('participants', 'array-contains', userId),
    orderBy('lastMessageTime', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const conversations = [];
    snapshot.forEach((doc) => {
      conversations.push({ id: doc.id, ...doc.data() });
    });
    callback(conversations);
  });
};

/**
 * Subscribes to messages in a specific conversation.
 */
export const subscribeToMessages = (conversationId, callback) => {
  const q = query(
    collection(db, `${CONVERSATIONS_COLLECTION}/${conversationId}/messages`),
    orderBy('timestamp', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    callback(messages);
  });
};
