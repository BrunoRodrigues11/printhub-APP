import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { PrinterDetail } from './pages/PrinterDetail';
import { AdminPanel } from './pages/AdminPanel';
import { Login } from './pages/Login';
import { MOCK_PRINTERS, MOCK_USERS, MOCK_SITES } from './constants';
import { Printer, PrinterStatus, User, UserRole, Site } from './types';

// Protected Route Component
const ProtectedRoute = ({ children, user }: { children: JSX.Element, user: User | null }) => {
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

function App() {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // In a real app, this would be fetched from an API
  const [printers, setPrinters] = useState<Printer[]>(MOCK_PRINTERS);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [sites, setSites] = useState<Site[]>(MOCK_SITES);

  // Check for stored session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('printhub_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('printhub_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('printhub_user');
  };

  // Quick status update for the Hub view
  const handleUpdateStatus = (id: string, newStatus: PrinterStatus) => {
    setPrinters(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          status: newStatus,
          lastUpdated: new Date().toISOString()
        };
      }
      return p;
    }));
  };

  // CRUD: Create Printer
  const handleAddPrinter = (data: Omit<Printer, 'id' | 'lastUpdated'>) => {
    const newPrinter: Printer = {
      ...data,
      id: `prt-${Date.now().toString().slice(-6)}`, // Generate simple ID
      lastUpdated: new Date().toISOString()
    };
    setPrinters(prev => [...prev, newPrinter]);
  };

  // CRUD: Update Printer
  const handleEditPrinter = (id: string, data: Omit<Printer, 'id' | 'lastUpdated'>) => {
    setPrinters(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          ...data,
          lastUpdated: new Date().toISOString()
        };
      }
      return p;
    }));
  };

  // CRUD: Delete Printer
  const handleDeletePrinter = (id: string) => {
    setPrinters(prev => prev.filter(p => p.id !== id));
  };

  // CRUD: Create User
  const handleAddUser = (data: Omit<User, 'id' | 'lastLogin'>) => {
    const newUser: User = {
      ...data,
      id: `usr-${Date.now().toString().slice(-6)}`,
      lastLogin: undefined,
      password: data.password || '123456' // Default password if not provided
    };
    setUsers(prev => [...prev, newUser]);
  };

  // CRUD: Update User
  const handleEditUser = (id: string, data: Omit<User, 'id' | 'lastLogin'>) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        // If password is empty string (not changed), keep the old one
        const { password, ...otherData } = data;
        const finalPassword = password ? password : u.password;
        
        return {
          ...u,
          ...otherData,
          password: finalPassword
        };
      }
      return u;
    }));
  };

  // CRUD: Delete User
  const handleDeleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  // CRUD: Create Site
  const handleAddSite = (data: Omit<Site, 'id'>) => {
    const newSite: Site = {
      ...data,
      id: `site-${Date.now().toString().slice(-6)}`
    };
    setSites(prev => [...prev, newSite]);
  };

  // CRUD: Update Site
  const handleEditSite = (id: string, data: Omit<Site, 'id'>) => {
    setSites(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, ...data };
      }
      return s;
    }));
  };

  // CRUD: Delete Site
  const handleDeleteSite = (id: string) => {
    setSites(prev => prev.filter(s => s.id !== id));
  };

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        
        <Route 
          path="/" 
          element={
            <ProtectedRoute user={currentUser}>
              <Dashboard printers={printers} onLogout={handleLogout} user={currentUser} />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute user={currentUser}>
              <AdminPanel 
                printers={printers} 
                onAddPrinter={handleAddPrinter}
                onEditPrinter={handleEditPrinter}
                onDeletePrinter={handleDeletePrinter}
                users={users}
                onAddUser={handleAddUser}
                onEditUser={handleEditUser}
                onDeleteUser={handleDeleteUser}
                sites={sites}
                onAddSite={handleAddSite}
                onEditSite={handleEditSite}
                onDeleteSite={handleDeleteSite}
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
              <PrinterDetail printers={printers} onUpdateStatus={handleUpdateStatus} />
            </ProtectedRoute>
          } 
        />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;