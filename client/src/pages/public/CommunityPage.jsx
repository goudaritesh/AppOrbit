import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, ThumbsUp, Plus, Eye, CheckCircle } from 'lucide-react';
import { doubtApi } from '../../api/doubtApi';
import Button from '../../components/ui/Button';
import SEOHead from '../../components/common/SEOHead';
import toast from 'react-hot-toast';

export const CommunityPage = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newDoubt, setNewDoubt] = useState({ title: '', content: '', tags: '' });
  
  // Expanded doubt view
  const [expandedId, setExpandedId] = useState(null);
  const [activeDoubt, setActiveDoubt] = useState(null);
  const [replyContent, setReplyContent] = useState('');

  const fetchDoubts = async () => {
    try {
      setLoading(true);
      const res = await doubtApi.getDoubts();
      setDoubts(res.data || []);
    } catch (err) {
      toast.error('Failed to load community discussions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoubts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to post a doubt');
      navigate('/login');
      return;
    }
    try {
      await doubtApi.createDoubt({
        title: newDoubt.title,
        content: newDoubt.content,
        tags: newDoubt.tags.split(',').map(t => t.trim()).filter(Boolean)
      });
      toast.success('Posted successfully');
      setNewDoubt({ title: '', content: '', tags: '' });
      setShowForm(false);
      fetchDoubts();
    } catch (err) {
      toast.error('Failed to post');
    }
  };

  const loadDoubtDetails = async (id) => {
    try {
      const res = await doubtApi.getDoubtById(id);
      setActiveDoubt(res.data);
    } catch (err) {
      toast.error('Failed to load doubt details');
    }
  };

  const toggleExpand = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      setActiveDoubt(null);
    } else {
      setExpandedId(id);
      loadDoubtDetails(id);
    }
  };

  const handleUpvote = async (e, id) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Please login to upvote');
      return;
    }
    try {
      await doubtApi.upvoteDoubt(id);
      fetchDoubts();
      if (expandedId === id) loadDoubtDetails(id);
    } catch (err) {
      toast.error('Failed to upvote');
    }
  };

  const handleReply = async (e, doubtId) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to reply');
      return;
    }
    try {
      await doubtApi.addReply(doubtId, { content: replyContent });
      setReplyContent('');
      toast.success('Reply added');
      loadDoubtDetails(doubtId);
      fetchDoubts();
    } catch (err) {
      toast.error('Failed to add reply');
    }
  };

  const handleAcceptAnswer = async (doubtId, replyId) => {
    try {
      await doubtApi.acceptReply(doubtId, replyId);
      loadDoubtDetails(doubtId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept answer');
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-surface-low">
      <SEOHead title="Developer Community & Doubts" description="Ask questions, get help, and discuss Android development with the AppOrbit community." />
      
      <div className="max-w-5xl mx-auto px-4 py-12 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold font-heading text-content-primary">Community Q&A</h1>
            <p className="text-content-secondary mt-1">Ask questions and share knowledge.</p>
          </div>
          <Button 
            variant="primary" 
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : 'Ask a Doubt'}
          </Button>
        </div>

        {showForm && (
          <div className="mb-8 p-6 bg-surface-elevated border border-white/10 rounded-2xl animate-in fade-in slide-in-from-top-4">
            <h3 className="text-lg font-bold mb-4">Post a new doubt</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Title (e.g., How to implement push notifications?)"
                  value={newDoubt.title}
                  onChange={(e) => setNewDoubt({ ...newDoubt, title: e.target.value })}
                  className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-content-primary focus:border-primary/50"
                  required
                />
              </div>
              <div>
                <textarea
                  placeholder="Describe your issue in detail..."
                  value={newDoubt.content}
                  onChange={(e) => setNewDoubt({ ...newDoubt, content: e.target.value })}
                  className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-content-primary focus:border-primary/50 h-32"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Tags (comma separated, e.g., java, kotlin, ui)"
                  value={newDoubt.tags}
                  onChange={(e) => setNewDoubt({ ...newDoubt, tags: e.target.value })}
                  className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-content-primary focus:border-primary/50"
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" variant="primary">Post Doubt</Button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {loading && doubts.length === 0 ? (
            <div className="text-center py-12 text-content-muted">Loading discussions...</div>
          ) : doubts.length === 0 ? (
            <div className="text-center py-12 bg-surface-elevated rounded-2xl border border-white/5 text-content-muted">
              No doubts posted yet. Be the first to ask!
            </div>
          ) : (
            doubts.map((doubt) => (
              <div key={doubt._id} className="bg-surface border border-white/5 hover:border-white/10 rounded-2xl overflow-hidden transition-all duration-200">
                <div 
                  className="p-5 cursor-pointer flex gap-4 items-start"
                  onClick={() => toggleExpand(doubt._id)}
                >
                  <div className="flex flex-col items-center gap-2 pt-1 min-w-[50px]">
                    <button 
                      onClick={(e) => handleUpvote(e, doubt._id)}
                      className={`flex flex-col items-center p-2 rounded-lg transition-colors ${doubt.upvotes.includes(user?._id) ? 'text-primary bg-primary/10' : 'text-content-muted hover:bg-white/5'}`}
                    >
                      <ThumbsUp className="w-5 h-5 mb-1" />
                      <span className="text-sm font-bold">{doubt.upvotes.length}</span>
                    </button>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-content-primary mb-1">{doubt.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-content-muted font-mono mb-3">
                      <span className="text-accent-cyan">{doubt.author?.name}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {doubt.views} views</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {doubt.replies.length} replies</span>
                    </div>
                    
                    <div className="flex gap-2 flex-wrap">
                      {doubt.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-white/5 text-content-secondary border border-white/10">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Expanded Details & Replies */}
                {expandedId === doubt._id && activeDoubt && (
                  <div className="border-t border-white/5 bg-surface-elevated/30 p-5 pl-[82px] animate-in fade-in slide-in-from-top-2">
                    <p className="text-content-secondary text-sm leading-relaxed mb-6 whitespace-pre-wrap">
                      {activeDoubt.content}
                    </p>

                    <h4 className="font-bold text-content-primary mb-4 flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      {activeDoubt.replies.length} Answers
                    </h4>

                    <div className="space-y-4 mb-6">
                      {activeDoubt.replies.map((reply) => (
                        <div key={reply._id} className={`p-4 rounded-xl border ${reply.isAcceptedAnswer ? 'bg-accent-emerald/5 border-accent-emerald/30' : 'bg-surface border-white/5'}`}>
                          <div className="flex items-start justify-between">
                            <p className="text-content-secondary text-sm whitespace-pre-wrap">{reply.content}</p>
                            {reply.isAcceptedAnswer && (
                              <CheckCircle className="w-5 h-5 text-accent-emerald flex-shrink-0 ml-4" />
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-3 text-xs font-mono text-content-muted">
                            <span>Answered by <span className="text-accent-cyan">{reply.author?.name}</span></span>
                            
                            {user?._id === activeDoubt.author?._id && (
                              <button 
                                onClick={() => handleAcceptAnswer(activeDoubt._id, reply._id)}
                                className={`px-2 py-1 rounded transition-colors ${reply.isAcceptedAnswer ? 'text-accent-rose hover:bg-accent-rose/10' : 'text-accent-emerald hover:bg-accent-emerald/10'}`}
                              >
                                {reply.isAcceptedAnswer ? 'Unmark Accepted' : 'Mark as Accepted'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={(e) => handleReply(e, activeDoubt._id)}>
                      <textarea
                        placeholder="Write your answer..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-content-primary focus:border-primary/50 h-24 mb-3"
                        required
                      />
                      <Button type="submit" variant="primary" size="sm">Post Answer</Button>
                    </form>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;
