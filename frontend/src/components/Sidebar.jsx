import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { Search, LogOut, Settings, X, Moon, Sun, Monitor } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuthStore();
  const { conversations, searchResults, searchUsers, selectUser, selectedUser, onlineUsers } = useChatStore();
  const { mode, setMode, color, setColor } = useThemeStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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
      <div className="p-4 border-b border-border-custom flex justify-between items-center">
        <h1 className="font-bold text-xl">Chats</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowSettings(!showSettings)} className="p-2 hover:bg-bg-primary rounded-full transition-colors">
            <Settings size={20} className="text-text-secondary" />
          </button>
          <button className="md:hidden p-2 hover:bg-bg-primary rounded-full" onClick={onClose}>
            <X size={20} className="text-text-secondary" />
          </button>
        </div>
      </div>

      {showSettings ? (
        <div className="p-4 flex-1 overflow-y-auto">
          <h2 className="font-semibold mb-4 text-text-secondary uppercase text-sm tracking-wider">Settings</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm mb-2 text-text-secondary">Theme Mode</label>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setMode('light')}
                  className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 border ${mode === 'light' ? 'bg-bg-primary border-accent text-accent' : 'border-border-custom hover:bg-bg-primary'}`}
                >
                  <Sun size={18} /> Light
                </button>
                <button 
                  onClick={() => setMode('dark')}
                  className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 border ${mode === 'dark' ? 'bg-bg-primary border-accent text-accent' : 'border-border-custom hover:bg-bg-primary'}`}
                >
                  <Moon size={18} /> Dark
                </button>
                <button 
                  onClick={() => setMode('system')}
                  className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 border ${mode === 'system' ? 'bg-bg-primary border-accent text-accent' : 'border-border-custom hover:bg-bg-primary'}`}
                >
                  <Monitor size={18} /> System
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2 text-text-secondary">Accent Color</label>
              <div className="flex gap-3">
                {['blue', 'green', 'purple'].map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${color === c ? 'ring-2 ring-offset-2 ring-offset-bg-secondary ring-text-primary' : ''}`}
                    style={{ backgroundColor: c === 'blue' ? '#3b82f6' : c === 'green' ? '#10b981' : '#8b5cf6' }}
                  />
                ))}
              </div>
            </div>
            
            <button 
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="p-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
              <input 
                type="text" 
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-bg-primary border border-border-custom rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

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
                  <div className="relative w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-bold uppercase shrink-0">
                    {(u.display_name || u.username || '?').charAt(0)}
                    <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-bg-secondary rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{u.display_name || u.username}</h3>
                    {!isSearching && item.lastMessage && (
                      <p className="text-xs text-text-secondary truncate">
                        {item.lastMessage.deleted_at ? 'This message was deleted' : (item.lastMessage.content || 'Attachment')}
                      </p>
                    )}
                  </div>
                  {isSearching && (
                    <button className="text-xs bg-accent text-white px-3 py-1.5 rounded-full font-medium hover:bg-opacity-90">
                      Chat
                    </button>
                  )}
                </div>
              );
            })}
            
            {listToRender.length === 0 && (
              <p className="text-center text-sm text-text-secondary mt-8">No users found</p>
            )}
          </div>
        </>
      )}

      <div className="p-4 border-t border-border-custom bg-bg-primary flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center font-bold uppercase shrink-0">
          {(user?.display_name || user?.username || '?').charAt(0)}
        </div>
        <div className="flex-1 truncate">
          <p className="text-sm font-semibold truncate">{user?.display_name || user?.username}</p>
          <p className="text-xs text-text-secondary truncate">My Account</p>
        </div>
      </div>
    </div>
  );
}
