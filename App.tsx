import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { PrinterDetail } from './pages/PrinterDetail';
import { AdminPanel } from './pages/AdminPanel';
import { Login } from './pages/Login';
import { User } from './types';

// Protected Route Component
const ProtectedRoute = ({ children, user }: { children: React.ReactElement, user: User | null }) => {
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

function App() {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Verifica se o usuário já estava logado ao abrir a página
  useEffect(() => {
    // Agora buscamos a chave 'user' que configuramos lá no Login.tsx
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      setCurrentUser(JSON.parse(storedUser));
    }
    
    setIsInitializing(false); // Terminou de checar
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    // A gravação no localStorage já está sendo feita lá dentro do Login.tsx
  };

  const handleLogout = () => {
    setCurrentUser(null);
    // Limpamos os dados da sessão
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  // Evita que a tela de Login pisque rapidamente antes de ler o localStorage
  if (isInitializing) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Carregando...</div>;
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        
        <Route 
          path="/" 
          element={
            <ProtectedRoute user={currentUser}>
              {/* O Dashboard agora busca os próprios dados! */}
              <Dashboard onLogout={handleLogout} user={currentUser} />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute user={currentUser}>
              {/* Deixamos o AdminPanel limpo. A lógica CRUD vai morar dentro dele agora. */}
              <AdminPanel 
                onLogout={handleLogout} 
                user={currentUser} 
              />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/printer/:id" 
          element={
            <ProtectedRoute user={currentUser}>
              {/* O Detalhe da impressora também buscará os dados da API pelo ID */}
              <PrinterDetail user={currentUser} />
            </ProtectedRoute>
          } 
        />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;