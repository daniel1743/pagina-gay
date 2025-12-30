import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  // 🔥 PREDETERMINADO: Modo oscuro por defecto (solo usa light si el usuario lo cambió antes)
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('chactivo-theme');
    // Si no hay tema guardado o es null/undefined, usar 'dark' (modo oscuro)
    return savedTheme === 'light' ? 'light' : 'dark';
  });

  // 🔥 APLICAR TEMA INMEDIATAMENTE al montar (antes del primer render)
  useEffect(() => {
    const root = window.document.documentElement;
    // Remover ambas clases primero
    root.classList.remove('light', 'dark');
    // Aplicar el tema actual (dark por defecto)
    root.classList.add(theme);
    // Guardar en localStorage
    localStorage.setItem('chactivo-theme', theme);
  }, [theme]);

  // 🔥 APLICAR TEMA OSCURO INMEDIATAMENTE al cargar la página (antes de React)
  useEffect(() => {
    // Asegurar que el HTML tenga la clase 'dark' desde el inicio
    const root = window.document.documentElement;
    const savedTheme = localStorage.getItem('chactivo-theme');
    if (!savedTheme || savedTheme !== 'light') {
      // Si no hay tema guardado o no es 'light', aplicar 'dark' inmediatamente
      root.classList.remove('light');
      root.classList.add('dark');
    }
  }, []); // Solo ejecutar una vez al montar

  const toggleTheme = () => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      // Guardar inmediatamente en localStorage
      localStorage.setItem('chactivo-theme', newTheme);
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
