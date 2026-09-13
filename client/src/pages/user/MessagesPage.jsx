import { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Send, User as UserIcon } from 'lucide-react';
import { subscribeToConversations, subscribeToMessages, sendMessage } from '../../services/chatService';
import Button from '../../components/ui/Button';

export const MessagesPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const currentUserId = user?.id || user?._id;
    if (!currentUserId) return;
    const unsubscribe = subscribeToConversations(currentUserId, (data) => {
      setConversations(data);
    });
    return () => unsubscribe();
  }, [user?._id]);

  useEffect(() => {
    if (!activeConversation) return;
    const unsubscribe = subscribeToMessages(activeConversation.id, (data) => {
      setMessages(data);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });
    return () => unsubscribe();
  }, [activeConversation]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;
    const currentUserId = user?.id || user?._id;
    await sendMessage(activeConversation.id, currentUserId, newMessage.trim());
    setNewMessage('');
  };

  const getOtherParticipantName = (conv) => {
    const currentUserId = user?.id || user?._id;
    const otherId = conv.participants.find((id) => id !== currentUserId);
    return conv.participantNames?.[otherId] || 'Unknown User';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full h-[calc(100vh-80px)] flex gap-6">
      {/* Sidebar */}
      <div className="w-1/3 bg-surface-elevated rounded-2xl border border-white/5 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-xl font-bold text-content-primary font-heading">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setActiveConversation(conv)}
              className={`p-4 border-b border-white/5 cursor-pointer transition-colors ${
                activeConversation?.id === conv.id ? 'bg-primary/10 border-l-4 border-l-primary' : 'hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface border border-white/10 flex items-center justify-center flex-shrink-0">
                  <UserIcon className="w-5 h-5 text-content-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-content-primary truncate">
                    {getOtherParticipantName(conv)}
                  </div>
                  <div className="text-sm text-content-secondary truncate">
                    {conv.lastMessage}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {conversations.length === 0 && (
            <div className="p-6 text-center text-content-muted text-sm">
              No conversations yet.
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-surface-elevated rounded-2xl border border-white/5 flex flex-col overflow-hidden">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-surface">
              <div className="w-10 h-10 rounded-full bg-surface-elevated border border-white/10 flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-content-secondary" />
              </div>
              <div className="font-semibold text-content-primary">
                {getOtherParticipantName(activeConversation)}
              </div>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => {
                const currentUserId = user?.id || user?._id;
                const isMe = msg.senderId === currentUserId;
                return (
                  <div key={msg.id || msg.timestamp} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                        isMe
                          ? 'bg-primary text-primary-foreground rounded-tr-sm'
                          : 'bg-surface border border-white/10 text-content-primary rounded-tl-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-4 bg-surface border-t border-white/5 flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-surface-elevated border border-white/10 rounded-xl px-4 py-2 text-content-primary focus:outline-none focus:border-primary/50"
              />
              <Button type="submit" variant="primary" disabled={!newMessage.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-content-muted">
            <UserIcon className="w-12 h-12 mb-4 opacity-20" />
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
