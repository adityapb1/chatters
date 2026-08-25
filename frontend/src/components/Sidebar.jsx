import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { Search, Settings, X, SquarePen } from 'lucide-react';
import ProfileModal from './ProfileModal';
import SettingsModal from './SettingsModal';

export default function Sidebar({ onClose }) {
  const { user } = useAuthStore();
  const { conversations, searchResults, searchUsers, selectUser, selectedUser, onlineUsers } = useChatStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      setIsSearching(true);
      const timer = setTimeout(() => searchUsers(searchQuery), 300);
      return () => clearTimeout(timer);
    } else {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleSelect = (item) => {
    selectUser(item.contact || item);
    setSearchQuery('');
    setIsSearching(false);
    if (window.innerWidth < 768) onClose();
  };

  const listToRender = isSearching ? searchResults : conversations;

  return (
    <div className="flex flex-col h-full bg-bg-secondary text-text-primary">
      {/* Header */}
      <div className="p-4 border-b border-border-custom flex justify-between items-center">
        <h1 className="font-bold text-xl">Chats</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setSearchQuery('')} 
            className="p-2 hover:bg-bg-primary rounded-full transition-colors text-text-secondary"
            title="New Chat"
            aria-label="New Chat"
          >
            <SquarePen size={20} />
          </button>
          <button className="md:hidden p-2 hover:bg-bg-primary rounded-full text-text-secondary" onClick={onClose} aria-label="Close Sidebar">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
          <input 
            type="text" 
            placeholder="Search users and messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-bg-primary border border-border-custom rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-accent transition-all placeholder-text-secondary"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {listToRender.map((item, idx) => {
          const u = isSearching ? item : item.contact;
          if (!u) return null;
          
          const isSelected = selectedUser?.id === u.id;
          const isOnline = onlineUsers.has(u.id);

          return (
            <div 
              key={idx}
              onClick={() => handleSelect(item)}
              className={`flex items-center gap-3 p-3 mx-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-bg-primary shadow-sm border border-border-custom' : 'hover:bg-bg-primary hover:bg-opacity-50 border border-transparent'}`}
            >
              <div className="relative w-10 h-10 rounded-full bg-bg-primary border border-border-custom flex items-center justify-center text-text-primary font-bold uppercase shrink-0 overflow-hidden">
                {u.profile_picture ? (
                  <img src={u.profile_picture} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  (u.display_name || u.username || '?').charAt(0)
                )}
                {isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 border-2 border-bg-secondary rounded-full bg-green-500"></span>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">{u.display_name || u.username}</h3>
                {!isSearching && item.lastMessage && (
                  <p className="text-xs text-text-secondary truncate">
                    {item.lastMessage.deleted_at ? 'This message was deleted' : item.lastMessage.content}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        
        {/* Empty States */}
        {!isSearching && listToRender.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <p className="text-sm text-text-primary font-medium mb-1">No conversations yet</p>
            <p className="text-xs text-text-secondary">Search for someone to start chatting.</p>
          </div>
        )}

        {isSearching && listToRender.length === 0 && (
          <div className="flex items-center justify-center mt-8">
            <p className="text-sm text-text-secondary">No results found</p>
          </div>
        )}
      </div>

      {/* Profile & Settings Footer */}
      <div className="p-4 border-t border-border-custom bg-bg-secondary flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer hover:bg-bg-primary p-2 -ml-2 rounded-lg transition-colors flex-1 min-w-0 mr-2"
          onClick={() => setShowProfileModal(true)}
          role="button"
          tabIndex={0}
        >
          <div className="w-10 h-10 rounded-full bg-bg-primary border border-border-custom flex items-center justify-center font-bold uppercase shrink-0 overflow-hidden text-text-primary">
            {user?.profile_picture ? (
               <img src={user.profile_picture} alt="My Avatar" className="w-full h-full object-cover" />
            ) : (
              (user?.display_name || user?.username || '?').charAt(0)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-text-primary">{user?.display_name || user?.username}</p>
            <p className="text-xs text-text-secondary truncate">My Account</p>
          </div>
        </div>
        
        <button 
          onClick={() => setShowSettingsModal(true)} 
          className="p-2 hover:bg-bg-primary rounded-full transition-colors text-text-secondary flex-shrink-0"
          aria-label="Settings"
          title="Settings"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* Modals */}
      {showProfileModal && <ProfileModal onClose={() => setShowProfileModal(false)} />}
      {showSettingsModal && <SettingsModal onClose={() => setShowSettingsModal(false)} />}
    </div>
  );
}
