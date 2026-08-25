import { useState, useEffect } from 'react';
import { X, Moon, Sun, Monitor, LogOut, Shield, Lock, User, Palette, AlertTriangle } from 'lucide-react';
import { useAuthStore, api } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

export default function SettingsModal({ onClose }) {
  const { user, logout, updatePrivacy, deleteAccount } = useAuthStore();
  const { mode, setMode, color, setColor } = useThemeStore();
  const [activeTab, setActiveTab] = useState('appearance');
  
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (activeTab === 'security') {
      fetchSessions();
    }
  }, [activeTab]);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await api.get('/users/sessions');
      setSessions(res.data);
    } catch (e) {
      console.error(e);
    }
    setLoadingSessions(false);
  };

  const handleRevokeSessions = async () => {
    try {
      await api.delete('/users/sessions');
      fetchSessions();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAccount = async () => {
    const success = await deleteAccount();
    if (success) onClose();
  };

  const handlePrivacyToggle = async (key, value) => {
    await updatePrivacy({ [key]: value });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showDeleteConfirm) setShowDeleteConfirm(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showDeleteConfirm]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => { if(e.target === e.currentTarget) onClose(); }}>
      <div className="bg-bg-secondary w-full max-w-2xl rounded-xl shadow-2xl border border-border-custom overflow-hidden flex h-[80vh]">
        
        {/* Sidebar */}
        <div className="w-48 border-r border-border-custom bg-bg-secondary p-4 flex flex-col gap-2 shrink-0">
          <h2 className="text-lg font-semibold text-text-primary px-3 mb-2">Settings</h2>
          
          <button onClick={() => setActiveTab('appearance')} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${activeTab === 'appearance' ? 'bg-bg-primary text-text-primary shadow-sm border border-border-custom' : 'text-text-secondary hover:bg-bg-primary hover:bg-opacity-50 border border-transparent'}`}>
            <Palette size={16} /> Appearance
          </button>
          <button onClick={() => setActiveTab('privacy')} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${activeTab === 'privacy' ? 'bg-bg-primary text-text-primary shadow-sm border border-border-custom' : 'text-text-secondary hover:bg-bg-primary hover:bg-opacity-50 border border-transparent'}`}>
            <Lock size={16} /> Privacy
          </button>
          <button onClick={() => setActiveTab('security')} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${activeTab === 'security' ? 'bg-bg-primary text-text-primary shadow-sm border border-border-custom' : 'text-text-secondary hover:bg-bg-primary hover:bg-opacity-50 border border-transparent'}`}>
            <Shield size={16} /> Security
          </button>
          <button onClick={() => setActiveTab('account')} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${activeTab === 'account' ? 'bg-bg-primary text-text-primary shadow-sm border border-border-custom' : 'text-text-secondary hover:bg-bg-primary hover:bg-opacity-50 border border-transparent'}`}>
            <User size={16} /> Account
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col bg-bg-primary">
          <div className="flex items-center justify-end p-4">
            <button onClick={onClose} className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-8 pb-8">
            
            {activeTab === 'appearance' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-xl font-semibold text-text-primary">Appearance</h3>
                
                <div>
                  <label className="block text-sm font-medium mb-4 text-text-primary">Theme Mode</label>
                  <div className="grid grid-cols-3 gap-4">
                    <button onClick={() => setMode('light')} className={`py-3 flex flex-col items-center justify-center gap-3 border rounded-xl transition-colors ${mode === 'light' ? 'bg-bg-secondary border-accent text-accent shadow-sm' : 'border-border-custom hover:bg-bg-secondary text-text-secondary'}`}>
                      <Sun size={24} /> <span className="text-sm font-medium">Light</span>
                    </button>
                    <button onClick={() => setMode('dark')} className={`py-3 flex flex-col items-center justify-center gap-3 border rounded-xl transition-colors ${mode === 'dark' ? 'bg-bg-secondary border-accent text-accent shadow-sm' : 'border-border-custom hover:bg-bg-secondary text-text-secondary'}`}>
                      <Moon size={24} /> <span className="text-sm font-medium">Dark</span>
                    </button>
                    <button onClick={() => setMode('system')} className={`py-3 flex flex-col items-center justify-center gap-3 border rounded-xl transition-colors ${mode === 'system' ? 'bg-bg-secondary border-accent text-accent shadow-sm' : 'border-border-custom hover:bg-bg-secondary text-text-secondary'}`}>
                      <Monitor size={24} /> <span className="text-sm font-medium">System</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-4 text-text-primary">Accent Color</label>
                  <div className="flex gap-4">
                    {['blue', 'green', 'purple'].map(c => (
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-4 ring-offset-bg-primary ring-text-primary' : ''}`}
                        style={{ backgroundColor: c === 'blue' ? '#3b82f6' : c === 'green' ? '#10b981' : '#8b5cf6' }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-xl font-semibold text-text-primary">Privacy</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-text-primary">Online Status</p>
                      <p className="text-sm text-text-secondary">Let others see when you are online</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={user?.online_status_visible} onChange={(e) => handlePrivacyToggle('online_status_visible', e.target.checked)} />
                      <div className="w-11 h-6 bg-border-custom peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-text-primary">Read Receipts</p>
                      <p className="text-sm text-text-secondary">Let others see when you've read their messages</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={user?.read_receipts_enabled} onChange={(e) => handlePrivacyToggle('read_receipts_enabled', e.target.checked)} />
                      <div className="w-11 h-6 bg-border-custom peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-text-primary">Typing Indicator</p>
                      <p className="text-sm text-text-secondary">Let others see when you are typing</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={user?.typing_indicator_enabled} onChange={(e) => handlePrivacyToggle('typing_indicator_enabled', e.target.checked)} />
                      <div className="w-11 h-6 bg-border-custom peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-xl font-semibold text-text-primary">Security & Sessions</h3>
                
                <div className="bg-bg-secondary rounded-xl p-4 border border-border-custom">
                  <h4 className="font-medium text-text-primary mb-2">Message Encryption</h4>
                  <p className="text-sm text-text-secondary flex items-center gap-2">
                    <Lock size={14} className="text-accent" /> TLS Encryption in Transit (Client-side E2EE pending deployment)
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-text-primary">Active Sessions</h4>
                    {sessions.length > 1 && (
                      <button onClick={handleRevokeSessions} className="text-sm text-red-500 hover:text-red-600 font-medium px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors">
                        Log Out Other Sessions
                      </button>
                    )}
                  </div>
                  
                  {loadingSessions ? (
                    <p className="text-sm text-text-secondary">Loading...</p>
                  ) : (
                    <div className="space-y-3">
                      {sessions.map(s => (
                        <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-border-custom bg-bg-secondary">
                          <div>
                            <p className="text-sm font-medium text-text-primary flex items-center gap-2">
                              <Monitor size={14} /> {s.device_info}
                            </p>
                            <p className="text-xs text-text-secondary mt-1">IP: {s.ip_address} • Last active: {new Date(s.last_active).toLocaleDateString()}</p>
                          </div>
                          {s.is_current && <span className="text-xs font-semibold px-2 py-1 bg-accent/10 text-accent rounded uppercase">Current</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-xl font-semibold text-text-primary">Account Management</h3>
                
                <div className="pt-2">
                  <button onClick={() => { onClose(); logout(); }} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-bg-secondary hover:bg-border-custom transition-colors font-medium text-text-primary border border-border-custom">
                    <LogOut size={18} /> Logout
                  </button>
                </div>

                <div className="border-t border-border-custom pt-8">
                  <h4 className="font-medium text-red-500 mb-2">Danger Zone</h4>
                  {!showDeleteConfirm ? (
                    <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-colors font-medium">
                      Delete Account
                    </button>
                  ) : (
                    <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
                        <div>
                          <p className="font-semibold text-red-500 mb-1">Delete your account?</p>
                          <p className="text-sm text-red-500/80 mb-4">
                            This action will permanently remove your account, messages, and associated data. This cannot be undone.
                          </p>
                          <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-sm font-medium rounded-lg bg-bg-primary text-text-primary border border-border-custom hover:bg-bg-secondary transition-colors">
                              Cancel
                            </button>
                            <button onClick={handleDeleteAccount} className="px-4 py-2 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors">
                              Yes, Delete My Account
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
