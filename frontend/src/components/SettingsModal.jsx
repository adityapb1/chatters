import { X, Moon, Sun, Monitor, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

export default function SettingsModal({ onClose }) {
  const { logout } = useAuthStore();
  const { mode, setMode, color, setColor } = useThemeStore();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-bg-secondary w-full max-w-md rounded-xl shadow-2xl border border-border-custom overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-custom">
          <h2 className="text-lg font-semibold text-text-primary">Settings</h2>
          <button onClick={onClose} className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-primary rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-8 overflow-y-auto max-h-[70vh]">
          {/* Appearance Section */}
          <div>
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Appearance</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm mb-3 text-text-primary">Theme Mode</label>
                <div className="grid grid-cols-3 gap-3">
                  <button 
                    onClick={() => setMode('light')}
                    className={`py-2 flex flex-col items-center justify-center gap-2 border rounded-lg transition-colors ${mode === 'light' ? 'bg-bg-primary border-accent text-accent' : 'border-border-custom hover:bg-bg-primary text-text-secondary'}`}
                  >
                    <Sun size={20} /> <span className="text-xs font-medium">Light</span>
                  </button>
                  <button 
                    onClick={() => setMode('dark')}
                    className={`py-2 flex flex-col items-center justify-center gap-2 border rounded-lg transition-colors ${mode === 'dark' ? 'bg-bg-primary border-accent text-accent' : 'border-border-custom hover:bg-bg-primary text-text-secondary'}`}
                  >
                    <Moon size={20} /> <span className="text-xs font-medium">Dark</span>
                  </button>
                  <button 
                    onClick={() => setMode('system')}
                    className={`py-2 flex flex-col items-center justify-center gap-2 border rounded-lg transition-colors ${mode === 'system' ? 'bg-bg-primary border-accent text-accent' : 'border-border-custom hover:bg-bg-primary text-text-secondary'}`}
                  >
                    <Monitor size={20} /> <span className="text-xs font-medium">System</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-3 text-text-primary">Accent Color</label>
                <div className="flex gap-4">
                  {['blue', 'green', 'purple'].map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-4 ring-offset-bg-secondary ring-text-primary' : ''}`}
                      style={{ backgroundColor: c === 'blue' ? '#3b82f6' : c === 'green' ? '#10b981' : '#8b5cf6' }}
                      aria-label={`${c} accent`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Account Section */}
          <div>
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Account</h3>
            <button 
              onClick={() => {
                onClose();
                logout();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-colors font-medium"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
