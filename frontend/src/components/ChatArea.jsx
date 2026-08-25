import { useState, useRef, useEffect } from 'react';
import { useAuthStore, api } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { Menu, Send, MoreVertical, Edit2, Trash2, X, Check, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';

export default function ChatArea({ toggleSidebar, socket }) {
  const { user } = useAuthStore();
  const { 
    selectedUser, 
    messages, 
    activeConversationId,
    onlineUsers,
    typingUsers,
    setNickname,
    fetchMessages,
    hasMoreMessages
  } = useChatStore();

  const [inputText, setInputText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [editingMessageId, setEditingMessageId] = useState(null);
  
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages.length, activeConversationId]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop } = scrollContainerRef.current;
      if (scrollTop === 0 && hasMoreMessages && activeConversationId) {
        fetchMessages(activeConversationId);
      }
    }
  };

  if (!selectedUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-bg-primary h-full">
        <div className="md:hidden absolute top-4 left-4">
          <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-bg-secondary text-text-secondary">
            <Menu size={20} />
          </button>
        </div>
        <div className="text-center space-y-3">
          <h2 className="text-xl font-semibold text-text-primary">Your Messages</h2>
          <p className="text-sm text-text-secondary">Select a conversation from the sidebar<br/>or search for someone to start chatting.</p>
        </div>
      </div>
    );
  }

  const isOnline = onlineUsers.has(selectedUser.id);
  const isTyping = typingUsers.has(selectedUser.id);

  const handleSend = () => {
    if (!inputText.trim()) return;

    if (editingMessageId) {
      api.put(`/messages/${editingMessageId}`, { content: inputText }).then(() => {
        setEditingMessageId(null);
        setInputText('');
      }).catch(err => console.error(err));
      return;
    }

    socket?.emit('send_message', {
      conversation_id: activeConversationId,
      content: inputText
    });

    setInputText('');
    socket?.emit('typing_stop', { conversation_id: activeConversationId });
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/messages/${id}`);
    } catch (err) {
      console.error('Failed to delete message');
    }
  };

  const handleTyping = (e) => {
    setInputText(e.target.value);
    if (e.target.value.length > 0) {
      socket?.emit('typing_start', { conversation_id: activeConversationId });
    } else {
      socket?.emit('typing_stop', { conversation_id: activeConversationId });
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-primary relative">
      {/* Header */}
      <div className="h-16 border-b border-border-custom px-4 flex items-center justify-between bg-bg-primary absolute top-0 w-full z-10">
        <div className="flex items-center gap-3">
          <button onClick={toggleSidebar} className="md:hidden p-2 -ml-2 rounded-lg hover:bg-bg-secondary text-text-secondary">
            <Menu size={20} />
          </button>
          
          <div className="relative w-10 h-10 rounded-full bg-bg-secondary border border-border-custom flex items-center justify-center font-bold uppercase overflow-hidden text-text-primary shrink-0">
            {selectedUser.profile_picture ? (
              <img src={selectedUser.profile_picture} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              (selectedUser.display_name || selectedUser.actual_username).charAt(0)
            )}
            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-bg-primary rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
          </div>
          
          <div>
            {isEditingNickname ? (
              <div className="flex items-center gap-2">
                <input 
                  autoFocus
                  type="text" 
                  value={newNickname}
                  onChange={(e) => setNewNickname(e.target.value)}
                  className="px-2 py-1 bg-bg-secondary border border-border-custom rounded text-sm focus:outline-none text-text-primary"
                />
                <button onClick={async () => { await setNickname(selectedUser.id, newNickname); setIsEditingNickname(false); }} className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"><Check size={16}/></button>
                <button onClick={() => setIsEditingNickname(false)} className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"><X size={16}/></button>
              </div>
            ) : (
              <>
                <h2 className="font-semibold text-text-primary leading-tight">
                  {selectedUser.display_name || selectedUser.actual_username}
                </h2>
                <p className="text-xs text-text-secondary font-medium">
                  {isTyping ? 'Typing...' : (isOnline ? 'Online' : 'Offline')}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-bg-secondary rounded-full text-text-secondary transition-colors">
            <MoreVertical size={20} />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-bg-secondary border border-border-custom rounded-lg shadow-lg z-50 overflow-hidden">
              <button 
                onClick={() => { setIsEditingNickname(true); setShowMenu(false); }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-bg-primary flex items-center gap-2 text-text-primary transition-colors"
              >
                <Edit2 size={16} /> Edit Nickname
              </button>
              <button 
                onClick={async () => { await setNickname(selectedUser.id, ''); setShowMenu(false); }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-bg-primary flex items-center gap-2 text-red-500 border-t border-border-custom transition-colors"
              >
                Reset Original Name
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Message List */}
      <div 
        className="flex-1 overflow-y-auto p-4 pt-20 space-y-4" 
        onScroll={handleScroll}
        ref={scrollContainerRef}
      >
        {messages.map((msg, idx) => {
          const isMine = msg.sender_id === user.id;
          const isDeleted = !!msg.deleted_at;

          return (
            <div key={msg.id || idx} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} group`}>
              <div className="flex items-center gap-2">
                
                {isMine && !isDeleted && (
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                    <button onClick={() => { setEditingMessageId(msg.id); setInputText(msg.content); }} className="p-1 text-text-secondary hover:text-accent transition-colors"><Edit2 size={14}/></button>
                    <button onClick={() => handleDelete(msg.id)} className="p-1 text-text-secondary hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                  </div>
                )}

                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 relative shadow-sm ${isDeleted ? 'bg-bg-secondary text-text-secondary border border-border-custom italic' : isMine ? 'bg-accent text-white rounded-br-none' : 'bg-bg-secondary text-text-primary rounded-bl-none border border-border-custom'}`}>
                  <p className="break-words text-[15px] leading-relaxed">{msg.content}</p>

                  <div className={`text-[10px] mt-1.5 flex items-center justify-end gap-1 font-medium ${isDeleted ? 'opacity-50' : isMine ? 'text-blue-100' : 'text-text-secondary'}`}>
                    {msg.edited_at && <span>Edited</span>}
                    <span>{format(new Date(msg.created_at || Date.now()), 'HH:mm')}</span>
                    {isMine && !isDeleted && (
                      <span className="ml-0.5">
                        {msg.status === 'READ' ? <CheckCheck size={12} /> : msg.status === 'DELIVERED' ? <CheckCheck size={12} /> : <Check size={12} />}
                      </span>
                    )}
                  </div>
                </div>

              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-bg-primary border-t border-border-custom relative">
        {editingMessageId && (
          <div className="flex justify-between items-center bg-bg-secondary px-4 py-2 rounded-t-xl border-x border-t border-border-custom text-sm mb-[-1px] relative z-10">
            <span className="text-text-secondary font-medium flex items-center gap-2"><Edit2 size={14}/> Editing message</span>
            <button onClick={() => { setEditingMessageId(null); setInputText(''); }} className="text-text-secondary hover:text-text-primary transition-colors"><X size={16}/></button>
          </div>
        )}
        
        <div className={`flex items-end gap-2 bg-bg-secondary p-2 border border-border-custom shadow-sm ${editingMessageId ? 'rounded-b-xl' : 'rounded-xl'}`}>
          <textarea
            value={inputText}
            onChange={handleTyping}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Write a message..."
            className="flex-1 max-h-32 min-h-[44px] bg-transparent resize-none py-3 px-3 focus:outline-none text-text-primary text-[15px] placeholder-text-secondary"
            rows="1"
          />
          
          <button 
            onClick={handleSend}
            disabled={!inputText.trim()}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shrink-0 mb-0.5 ${inputText.trim() ? 'bg-accent text-white shadow-md' : 'bg-transparent text-text-secondary'}`}
          >
            {editingMessageId ? <Check size={20} /> : <Send size={18} className={inputText.trim() ? 'translate-x-0.5' : ''} />}
          </button>
        </div>
      </div>
    </div>
  );
}
