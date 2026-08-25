import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isCheckingAuth } = useAuthStore();
  
  if (isCheckingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-primary text-text-primary">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) return <Navigate to="/login" />;
  return children;
};

function App() {
  const { checkAuth } = useAuthStore();
  const { initTheme } = useThemeStore();

  useEffect(() => {
    checkAuth();
    initTheme();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
