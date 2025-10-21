import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const GUEST_USER = {
  id: 'guest',
  username: 'Invitado',
  isGuest: true,
  isPremium: false,
  verified: false,
  avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=guest',
  quickPhrases: [],
  theme: {},
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('chactivo_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setUser(GUEST_USER);
    }
    setLoading(false);
  }, []);

  const syncUserToDb = (updatedUser) => {
    localStorage.setItem('chactivo_user', JSON.stringify(updatedUser));

    if (updatedUser.isGuest) return;

    const users = JSON.parse(localStorage.getItem('chactivo_users') || '[]');
    const userIndex = users.findIndex(u => u.id === updatedUser.id);
    if (userIndex !== -1) {
      const dbUser = users[userIndex];
      // Retain password from DB
      users[userIndex] = { ...dbUser, ...updatedUser };
      localStorage.setItem('chactivo_users', JSON.stringify(users));
    }
  };


  const login = (email, password) => {
    const users = JSON.parse(localStorage.getItem('chactivo_users') || '[]');
    const foundUser = users.find(u => u.email === email && u.password === password);
    
    if (foundUser) {
      const userToStore = { ...foundUser, isGuest: false };
      delete userToStore.password;
      setUser(userToStore);
      syncUserToDb(userToStore);
      toast({
        title: "¡Bienvenido de vuelta! 🌈",
        description: `Hola ${foundUser.username}`,
      });
      return true;
    }
    
    toast({
      title: "Error de autenticación",
      description: "Email o contraseña incorrectos",
      variant: "destructive",
    });
    return false;
  };

  const register = (userData) => {
    const users = JSON.parse(localStorage.getItem('chactivo_users') || '[]');
    
    if (users.find(u => u.email === userData.email)) {
      toast({
        title: "Email ya registrado",
        description: "Este email ya está en uso",
        variant: "destructive",
      });
      return false;
    }

    const newUser = {
      id: Date.now().toString(),
      ...userData,
      isPremium: false,
      verified: false,
      createdAt: new Date().toISOString(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`,
      quickPhrases: [],
      theme: {},
    };
    
    const { password, ...userToStore } = newUser;
    const userForDb = { ...newUser };
    users.push(userForDb);
    localStorage.setItem('chactivo_users', JSON.stringify(users));

    setUser({ ...userToStore, isGuest: false });
    localStorage.setItem('chactivo_user', JSON.stringify({ ...userToStore, isGuest: false }));


    toast({
      title: "¡Cuenta creada! 🎉",
      description: "Bienvenido a Chactivo",
    });
    return true;
  };

  const logout = () => {
    setUser(GUEST_USER);
    localStorage.removeItem('chactivo_user');
    toast({
      title: "Sesión cerrada",
      description: "¡Hasta pronto! 👋",
    });
  };

  const updateProfile = (updates) => {
    if (!user || user.isGuest) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    syncUserToDb(updatedUser);
  };
  
  const updateThemeSetting = (setting, value) => {
    if (!user || user.isGuest) return;
    const updatedUser = { 
      ...user,
      theme: {
        ...user.theme,
        [setting]: value
      }
    };
    setUser(updatedUser);
    syncUserToDb(updatedUser);
  };
  
  const addQuickPhrase = (phrase) => {
    if (!user || user.isGuest) return;
    const updatedPhrases = [...(user.quickPhrases || []), phrase];
    const updatedUser = { ...user, quickPhrases: updatedPhrases };
    setUser(updatedUser);
    syncUserToDb(updatedUser);
  };
  
  const removeQuickPhrase = (phraseToRemove) => {
    if (!user || user.isGuest) return;
    const updatedPhrases = (user.quickPhrases || []).filter(p => p !== phraseToRemove);
    const updatedUser = { ...user, quickPhrases: updatedPhrases };
    setUser(updatedUser);
    syncUserToDb(updatedUser);
  };

  const upgradeToPremium = () => {
    if (!user || user.isGuest) return;
    const updatedUser = { ...user, isPremium: true };
    setUser(updatedUser);
    syncUserToDb(updatedUser);

    toast({
      title: "¡Ahora eres Premium! 👑",
      description: "Disfruta de todas las funciones exclusivas",
    });
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    upgradeToPremium,
    updateThemeSetting,
    addQuickPhrase,
    removeQuickPhrase,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
