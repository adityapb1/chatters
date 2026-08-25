import { create } from 'zustand';

const applyMode = (mode) => {
  if (mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

const useThemeStore = create((set) => ({
  mode: localStorage.getItem('theme_mode') || 'system', // light, dark, system
  color: localStorage.getItem('theme_color') || 'blue', // default/blue, green, purple

  setMode: (mode) => {
    localStorage.setItem('theme_mode', mode);
    set({ mode });
    applyMode(mode);
  },

  setColor: (color) => {
    localStorage.setItem('theme_color', color);
    set({ color });
    document.documentElement.setAttribute('data-color', color);
  },

  initTheme: () => {
    const mode = localStorage.getItem('theme_mode') || 'system';
    const color = localStorage.getItem('theme_color') || 'blue';
    applyMode(mode);
    document.documentElement.setAttribute('data-color', color);

    // Listen to system changes if in system mode
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (localStorage.getItem('theme_mode') === 'system') {
        applyMode('system');
      }
    });
  }
}));

export { useThemeStore };
