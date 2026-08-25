import { useState, useRef, useEffect } from 'react';
import { useAuthStore, api } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { Menu, Smile, Send, MoreVertical, Edit2, Trash2, X, Check } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { format } from 'date-fns';

export default function ChatArea({ toggleSidebar, socket }) {
  const { user } = useAuthStore();
  const { selectedUser, messages, fetchMessages, hasMoreMessages, activeConversationId, onlineUsers, typingUsers, setNickname } = useChatStore();
  
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  
  const [editingMessageId, setEditingMessageId] = useState(null);
  
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    // Only scroll to bottom on initial load or if we are already at the bottom
    // For pagination, we want to maintain scroll position, but this is a simplified version
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeConversationId]);

  useEffect(() => {
    if (selectedUser) setNewNickname(selectedUser.display_name || selectedUser.actual_username);
  }, [selectedUser]);

  const handleScroll = (e) => {
    if (e.target.scrollTop === 0 && hasMoreMessages && messages.length > 0) {
      const oldestMessageId = messages[0].id;
      fetchMessages(activeConversationId, oldestMessageId);
    }
  };

  if (!selectedUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-bg-primary p-4">
        <button onClick={toggleSidebar} className="md:hidden absolute top-4 left-4 p-2 bg-bg-secondary rounded-lg">
          <Menu size={20} />
        </button>
        <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center mb-4 border border-border-custom">
          <Send size={24} className="text-text-secondary" />
        </div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">Your Messages</h2>
        <p className="text-text-secondary text-center max-w-sm">Select a conversation from the sidebar or search for a user to start chatting.</p>
      </div>
    );
  }

  const isOnline = onlineUsers.has(selectedUser.id);
  const isTyping = typingUsers.has(selectedUser.id);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    if (editingMessageId) {
      try {
        await api.patch(`/messages/${editingMessageId}`, { content: inputText });
        setEditingMessageId(null);
      } catch (err) {
        console.error('Failed to edit message');
      }
    } else {
      socket?.emit('send_message', {
        conversation_id: activeConversationId,
        content: inputText,
        type: 'TEXT'
      });
    }

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
          
          <div className="relative w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center font-bold uppercase">
            {(selectedUser.display_name || selectedUser.actual_username).charAt(0)}
            <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-bg-primary rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
          </div>
          
          <div>
            {isEditingNickname ? (
              <div className="flex items-center gap-2">
                <input 
                  autoFocus
                  type="text" 
                  value={newNickname}
                  onChange={(e) => setNewNickname(e.target.value)}
                  className="px-2 py-1 bg-bg-secondary border border-border-custom rounded text-sm focus:outline-none"
                />
                <button onClick={async () => { await setNickname(selectedUser.id, newNickname); setIsEditingNickname(false); }} className="p-1 text-green-600 hover:bg-green-100 rounded"><Check size={16}/></button>
                <button onClick={() => setIsEditingNickname(false)} className="p-1 text-red-600 hover:bg-red-100 rounded"><X size={16}/></button>
              </div>
            ) : (
              <>
                <h2 className="font-semibold text-text-primary leading-tight">
                  {selectedUser.display_name || selectedUser.actual_username}
                </h2>
                <p className="text-xs text-text-secondary">
                  {isTyping ? 'typing...' : (isOnline ? 'Online' : 'Offline')}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-bg-secondary rounded-full text-text-secondary">
            <MoreVertical size={20} />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-bg-primary border border-border-custom rounded-lg shadow-lg z-50 overflow-hidden">
              <button 
                onClick={() => { setIsEditingNickname(true); setShowMenu(false); }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-bg-secondary flex items-center gap-2 text-text-primary"
              >
                <Edit2 size={16} /> Edit Nickname
              </button>
              <button 
                onClick={async () => { await setNickname(selectedUser.id, ''); setShowMenu(false); }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-bg-secondary flex items-center gap-2 text-red-600 border-t border-border-custom"
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
                    {msg.type === 'TEXT' && (
                      <button onClick={() => { setEditingMessageId(msg.id); setInputText(msg.content); }} className="p-1 text-text-secondary hover:text-accent"><Edit2 size={14}/></button>
                    )}
                    <button onClick={() => handleDelete(msg.id)} className="p-1 text-text-secondary hover:text-red-500"><Trash2 size={14}/></button>
                  </div>
                )}

                <div className={`max-w-[75%] rounded-2xl px-4 py-2 relative ${isDeleted ? 'bg-bg-secondary text-text-secondary border border-border-custom italic' : isMine ? 'bg-accent text-white rounded-br-none' : 'bg-bg-secondary text-text-primary rounded-bl-none border border-border-custom'}`}>
                  {msg.type === 'TEXT' && <p className="break-words">{msg.content}</p>}

                  <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isDeleted ? 'opacity-50' : isMine ? 'text-blue-100' : 'text-text-secondary'}`}>
                    {msg.edited_at && <span>(edited)</span>}
                    <span>{format(new Date(msg.created_at || Date.now()), 'HH:mm')}</span>
                    {isMine && !isDeleted && (
                      <span>{msg.status === 'READ' ? '✓✓' : msg.status === 'DELIVERED' ? '✓✓' : '✓'}</span>
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
          <div className="flex justify-between items-center bg-bg-secondary p-2 rounded-t-lg border-x border-t border-border-custom text-sm">
            <span className="text-text-secondary italic flex items-center gap-2"><Edit2 size={14}/> Editing message</span>
            <button onClick={() => { setEditingMessageId(null); setInputText(''); }}><X size={16}/></button>
          </div>
        )}
        
        {showEmojiPicker && (
          <div className="absolute bottom-20 left-4 z-50 shadow-xl rounded-lg">
            <EmojiPicker onEmojiClick={(e) => { setInputText(prev => prev + e.emoji); setShowEmojiPicker(false); }} theme="auto" />
          </div>
        )}
        
        <div className={`flex items-end gap-2 bg-bg-secondary p-2 border border-border-custom ${editingMessageId ? 'rounded-b-2xl' : 'rounded-2xl'}`}>
          <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-text-secondary hover:text-accent rounded-full transition-colors">
            <Smile size={22} />
          </button>
          

          <textarea
            value={inputText}
            onChange={handleTyping}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 max-h-32 min-h-[44px] bg-transparent resize-none py-3 px-2 focus:outline-none text-text-primary text-sm"
            rows="1"
          />
          
          <button 
            onClick={handleSend}
            disabled={!inputText.trim()}
            className={`p-3 rounded-full flex items-center justify-center transition-colors ${inputText.trim() ? 'bg-accent text-white' : 'bg-transparent text-text-secondary'}`}
          >
            {editingMessageId ? <Check size={20} /> : <Send size={20} className={inputText.trim() ? 'translate-x-0.5' : ''} />}
          </button>
        </div>
      </div>
    </div>
  );
}
