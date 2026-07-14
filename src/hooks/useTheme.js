import { useState, useEffect } from 'react';

export const useTheme = () => {
  const [tema, setTema] = useState('light');

  useEffect(() => {
    const temaSalvo = localStorage.getItem('limpezaAcida_tema');
    if (temaSalvo) {
      setTema(temaSalvo);
      document.documentElement.classList.toggle('dark', temaSalvo === 'dark');
    } else {
      // Preferencia do sistema
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        setTema('dark');
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  const alternarTema = () => {
    const novoTema = tema === 'light' ? 'dark' : 'light';
    setTema(novoTema);
    localStorage.setItem('limpezaAcida_tema', novoTema);
    document.documentElement.classList.toggle('dark', novoTema === 'dark');
  };

  return { tema, alternarTema };
};